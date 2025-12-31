import logging
import time
from decimal import Decimal
from typing import (
    Iterable,
    List,
)

from apps.customers.models import Client
from apps.orders.models import (
    Cart,
    CartItem,
)
from apps.products.models import (
    Favorite,
    Product,
    ProductVariant,
)
from apps.products.selectors import (
    base_products_qs,
)
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError
from django.db.models import (
    Case,
    F,
    IntegerField,
    Value,
    When,
)
from django_redis import get_redis_connection
from rest_framework.exceptions import (
    APIException,
    NotAuthenticated,
)

DEC_100 = Decimal("100")

logger = logging.getLogger(__name__)


class ClientProfileRequired(APIException):
    status_code = 409
    default_detail = "Для добавления требуется заполненный профиль клиента"
    default_code = "client_profile_required"


def compute_variant_current_price(variant: ProductVariant) -> Decimal:
    sale = Decimal(variant.product.sale or 0)
    return (variant.base_price * (DEC_100 - sale)) / DEC_100


def bulk_recalc_variants_for_product(product: Product):
    ProductVariant.objects.filter(product=product).update(
        current_price=F("base_price")
        * (Value(DEC_100) - Value(Decimal(product.sale)))
        / Value(DEC_100)
    )


def cart_ids_for_product(product: Product) -> Iterable[int]:
    return (
        CartItem.objects.filter(product=product)
        .values_list("cart_id", flat=True)
        .distinct()
    )


def cart_ids_for_variant(variant: ProductVariant) -> Iterable[int]:
    return (
        CartItem.objects.filter(product_variant=variant)
        .values_list("cart_id", flat=True)
        .distinct()
    )


def update_carts(cart_ids: Iterable[int]) -> None:
    for cid in cart_ids:
        try:
            cart = Cart.objects.get(pk=cid)
        except Cart.DoesNotExist:
            continue
        cart_recalculate(cart)


def cart_recalculate(cart: Cart):
    items = list(
        CartItem.objects.filter(cart=cart).select_related("product_variant", "product")
    )
    total = Decimal("0")
    for it in items:
        price = getattr(it.product_variant, "current_price", None)
        if price is None:
            price = compute_variant_current_price(it.product_variant)
        total += Decimal(str(price)) * Decimal(it.qty)

    cart.total_sum = total
    cart.save(update_fields=["total_sum"])


def get_request_client_or_raise(request):
    if not request.user or not request.user.is_authenticated:
        raise NotAuthenticated("Требуется авторизация")

    user = request.user
    try:
        return user.client
    except ObjectDoesNotExist:
        raise ClientProfileRequired()


def favorites_add(client: Client, *, product: Product) -> None:
    try:
        Favorite.objects.create(
            client=client,
            product=product,
        )
    except IntegrityError:
        pass


def favorites_remove(client: Client, *, product: Product) -> None:
    Favorite.objects.filter(
        client=client,
        product=product,
    ).delete()


def favorites_products_qs(client: Client):
    return (
        Product.objects.filter(
            is_active=True,
            favorited_by__client=client,
        )
        .select_related("brand", "category")
        .order_by("-favorited_by__created_at")
    )


# -----------------------------
# Recently viewed (Redis-safe)
# -----------------------------


def _rv_conn():
    """
    Redis НЕ должен валить API.
    Если Redis недоступен — просто отключаем recently_viewed без 500.
    """
    try:
        return get_redis_connection("recently_viewed")
    except Exception as e:
        logger.warning("recently_viewed redis unavailable: %s", e)
        return None


def _rv_key(*, user_id=None, annon_id=None) -> str | None:
    if user_id:
        return f"rv:u:{user_id}"
    if annon_id:
        return f"rv:a:{annon_id}"
    return None


def add_recent_view(
    *,
    product_id: int,
    user_id: int | None,
    annon_id: str | None,
    ts: float | None = None,
) -> None:
    key = _rv_key(user_id=user_id, annon_id=annon_id)
    if not key:
        return

    conn = _rv_conn()
    if conn is None:
        return

    try:
        score = ts or time.time()
        conn.zadd(key, {product_id: score})

        max_len = settings.RECENTLY_VIEWED["MAX_LEN"]
        size = conn.zcard(key)
        if size > max_len:
            conn.zremrangebyrank(key, 0, size - max_len - 1)

        conn.expire(key, settings.RECENTLY_VIEWED["TTL_SECONDS"])
    except Exception as e:
        logger.warning("add_recent_view failed: %s", e)


def get_recent_ids(
    *, user_id: int | None, annon_id: str | None, limit: int = 10
) -> List[int]:
    key = _rv_key(
        user_id=user_id,
        annon_id=annon_id,
    )
    if not key:
        return []

    conn = _rv_conn()
    if conn is None:
        return []

    try:
        ids = conn.zrevrange(
            key,
            0,
            max(0, limit - 1),
        )
        return [int(i) for i in ids]
    except Exception as e:
        logger.warning("get_recent_ids failed: %s", e)
        return []


def products_preserve_order(ids: List[int]):
    if not ids:
        return base_products_qs().none()
    ordering = Case(
        *[When(pk=pk, then=pos) for pos, pk in enumerate(ids)],
        output_field=IntegerField(),
    )
    return base_products_qs().filter(pk__in=ids).order_by(ordering)
