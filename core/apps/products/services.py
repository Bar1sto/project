from decimal import Decimal
from django.db import IntegrityError
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.exceptions import (
    APIException,
    NotAuthenticated,
)
from apps.customers.models import Client
from django.db.models import (
    F,
    Value,
)
from typing import Iterable
from apps.products.models import (
    Product,
    ProductVariant,
    Favorite,
)
from apps.orders.models import (
    Cart,
    CartItem,
)


DEC_100 = Decimal("100")

class ClientProfileRequired(APIException):
    status_code = 409
    default_detail = "Для добавления требуется заполненный профиль клиента"
    default_code = "client_profile_required"

def compute_variant_current_price(variant: ProductVariant) -> Decimal:
    sale = Decimal(variant.product.sale or 0)
    return (variant.base_price * (DEC_100 - sale)) / DEC_100

def bulk_recalc_variants_for_product(product: Product):
    ProductVariant.objects.filter(
        product=product
    ).update(
        current_price=F('base_price') * (Value(DEC_100) - Value(Decimal(product.sale))) / Value(DEC_100)
    )
    
    
def cart_ids_for_product(product: Product) -> Iterable[int]:
    return (
        CartItem.objects.filter(product=product).values_list("cart_id", flat=True).distinct()
    )
    
def cart_ids_for_variant(variant: ProductVariant) -> Iterable[int]:
    return (
        CartItem.objects.filter(product_variant=variant).values_list("cart_id", flat=True).distinct()
    )
    
def update_carts(cart_ids: Iterable[int]) -> None:
    for cid in cart_ids:
        try:
            cart = Cart.objects.get(pk=cid)
        except Cart.DoesNotExist:
            continue
        cart.update_total()
        
def get_request_client_or_raise(request) -> Client:
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        raise NotAuthenticated('Требуется авторизация')
    
    try:
        return user.client
    except ObjectDoesNotExist:
        raise ClientProfileRequired()
    
def favorites_add(client: Client, *, product: Product) -> None:
    try:
        Favorite.objects.create(
            client=client,
            product=product
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
        ).select_related("brand", "category").order_by("-favorited_by__created_at")
    )
