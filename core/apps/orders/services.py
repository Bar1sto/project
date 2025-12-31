from decimal import Decimal
from typing import Any, Dict, Optional

from apps.customers.models import Bonus
from apps.payments.clients import TBankClient
from apps.payments.models import Payment
from apps.products.models import ProductVariant
from apps.products.selectors import base_products_qs
from django.db import transaction
from django.db.models import Case, IntegerField, When
from django.utils import timezone
from django_redis import get_redis_connection

from .models import Cart, CartItem
from .selectors import cart_items_qs, get_or_create_draft_cart

DEC_100 = Decimal("100")

# Redis (анонимная корзина)


@transaction.atomic
def mark_cart_paid(cart: Cart):
    """
    Помечает корзину как оформленный заказ (после успешной оплаты).

    Должно происходить автоматически, без участия админа:
    - is_ordered = True (чтобы заказ попал в историю)
    - status = 'not_completed' (у вас статусы: draft / completed / not_completed)
    - ordered_at = текущая дата (у вас DateField)
    - начисление бонусов (5%) через Bonus.create_from_order(cart)
    """
    if cart.is_ordered:
        return cart

    # пересчитываем сумму (важно: обновляет и объект, и БД)
    cart_recalculate(cart)

    cart.is_ordered = True
    cart.status = "not_completed"
    cart.ordered_at = timezone.now().date()
    cart.save(update_fields=["is_ordered", "status", "ordered_at", "cart_total_sum"])

    # начисляем бонусы (идемпотентность должна быть внутри Bonus.create_from_order)
    try:
        Bonus.create_from_order(cart)
    except Exception:
        import logging

        logging.getLogger(__name__).exception(
            "Bonus.create_from_order failed for cart=%s", cart.pk
        )

    return cart


def _cart_conn():
    return get_redis_connection("cart")


def _cart_key(*, user_id=None, anon_id=None):
    if user_id:
        return f"cart:u:{user_id}"
    if anon_id:
        return f"cart:a:{anon_id}"
    return None


def anon_cart_add(*, anon_id: str, variant_id: int, qty: int) -> None:
    key = _cart_key(user_id=None, anon_id=anon_id)
    if not key:
        return
    conn = _cart_conn()
    if qty <= 0:
        conn.hdel(key, str(variant_id))
    else:
        conn.hset(key, str(variant_id), int(qty))


def anon_cart_remove(*, anon_id: str, variant_id: int) -> None:
    key = _cart_key(user_id=None, anon_id=anon_id)
    if not key:
        return
    _cart_conn().hdel(key, str(variant_id))


def anon_cart_clear(*, user_id=None, anon_id=None) -> None:
    key = _cart_key(user_id=user_id, anon_id=anon_id)
    if not key:
        return
    _cart_conn().delete(key)


def anon_cart_items(*, user_id=None, anon_id=None) -> dict[int, int]:
    key = _cart_key(user_id=user_id, anon_id=anon_id)
    if not key:
        return {}
    raw = _cart_conn().hgetall(key)
    out = {}
    for k, v in raw.items():
        try:
            kk = k.decode() if hasattr(k, "decode") else k
            vv = v.decode() if hasattr(v, "decode") else v
            out[int(kk)] = int(vv)
        except Exception:
            pass
    return out


# Преобразование корзины в ответ


def build_cart_response_from_ids(qty_map: dict[int, int]) -> tuple[list[dict], str]:
    if not qty_map:
        return [], "0.00"

    variants = ProductVariant.objects.select_related(
        "product", "product__brand", "product__category"
    ).filter(pk__in=list(qty_map.keys()))

    items = []
    total = Decimal("0")
    for v in variants:
        p = v.product
        if not p.is_active:
            continue
        qty = int(qty_map.get(v.id, 0))
        if qty <= 0:
            continue

        price = v.current_price or Decimal("0")
        line_total = price * qty
        total += line_total

        items.append(
            {
                "variant_id": v.id,
                "qty": qty,
                "price": f"{price:.2f}",
                "line_total": f"{line_total:.2f}",
                "variant": {
                    "size_type": v.size_type,
                    "size_value": v.size_value,
                    "color": v.color,
                    "in_stock": v.is_active,
                    "is_order": v.is_order,
                },
                "product": {
                    "slug": p.slug,
                    "name": p.name,
                    "image": (p.image.url if getattr(p, "image", None) else None),
                    "brand": (p.brand.name if p.brand else None),
                    "category": (p.category.name if p.category else None),
                },
            }
        )

    return items, f"{total:.2f}"


# БД корзина (авторизованный клиент)


def db_cart_add_or_set(client, *, variant_id: int, qty: int) -> None:
    cart = get_or_create_draft_cart(client)
    if qty <= 0:
        CartItem.objects.filter(cart=cart, product_variant_id=variant_id).delete()
        cart_recalculate(cart)
        return

    variant = (
        ProductVariant.objects.select_related("product").filter(pk=variant_id).first()
    )
    if not variant or not variant.product.is_active:
        return

    obj, created = CartItem.objects.get_or_create(
        cart=cart,
        product=variant.product,
        product_variant=variant,
        defaults={"quantity": qty},
    )
    if not created:
        obj.quantity = qty
        obj.save(update_fields=["quantity"])

    cart_recalculate(cart)


def db_cart_remove(client, *, variant_id: int) -> None:
    cart = get_or_create_draft_cart(client)
    CartItem.objects.filter(cart=cart, product_variant_id=variant_id).delete()
    cart_recalculate(cart)


def build_db_cart_response(client) -> dict:
    cart = get_or_create_draft_cart(client)
    items_qs = cart_items_qs(cart)

    items = []
    total = Decimal("0")
    for ci in items_qs:
        v = ci.product_variant
        p = v.product
        price = v.current_price or Decimal("0")
        line_total = price * ci.quantity
        total += line_total
        items.append(
            {
                "variant_id": v.id,
                "qty": ci.quantity,
                "price": f"{price:.2f}",
                "line_total": f"{line_total:.2f}",
                "variant": {
                    "size_type": v.size_type,
                    "size_value": v.size_value,
                    "color": v.color,
                    "in_stock": v.is_active,
                    "is_order": v.is_order,
                },
                "product": {
                    "slug": p.slug,
                    "name": p.name,
                    "image": (p.image.url if getattr(p, "image", None) else None),
                    "brand": (p.brand.name if p.brand else None),
                    "category": (p.category.name if p.category else None),
                },
            }
        )

    # держим сумму в модели актуальной
    cart.cart_total_sum = total
    cart.save(update_fields=["cart_total_sum"])

    return {"items": items, "total": f"{total:.2f}"}


# Merge анонимной корзины в БД


def merge_anon_cart_into_db_cart(*, client, anon_id: str) -> None:
    anon_map = anon_cart_items(user_id=None, anon_id=anon_id)
    if not anon_map:
        return
    cart = get_or_create_draft_cart(client)
    existing = {ci.product_variant_id: ci.quantity for ci in cart_items_qs(cart)}

    for vid, qty in anon_map.items():
        final_qty = max(existing.get(vid, 0), int(qty))
        if final_qty > 0:
            db_cart_add_or_set(client, variant_id=vid, qty=final_qty)

    anon_cart_clear(user_id=None, anon_id=anon_id)


# Оформление / бонусы / пересчёт


def cart_recalculate(cart: Cart) -> None:
    """Пересчитать итог корзины и сохранить в cart.cart_total_sum.

    ВАЖНО: нельзя делать только QuerySet.update(), иначе объект `cart` остаётся
    со старым значением и последующий cart.save() может перезатереть сумму.
    """
    items = cart_items_qs(cart)
    total = Decimal("0")
    for ci in items:
        v = ci.product_variant
        price = v.current_price or Decimal("0")
        total += price * ci.quantity

    cart.cart_total_sum = total
    cart.save(update_fields=["cart_total_sum"])


@transaction.atomic
def order_mark_paid_by_id(cart_id: int) -> None:
    cart = Cart.objects.select_for_update().get(pk=cart_id)

    # Если уже оформлена — ничего не делаем
    if cart.is_ordered:
        return

    cart_recalculate(cart)

    cart.status = "not_completed"
    cart.is_ordered = True
    cart.ordered_at = timezone.now().date()  # DateField
    cart.save(update_fields=["status", "is_ordered", "ordered_at", "cart_total_sum"])

    try:
        Bonus.create_from_order(cart)
    except Exception:
        import logging

        logging.getLogger(__name__).exception(
            "Bonus.create_from_order(cart=%s) failed", cart.pk
        )


def repeat_order_into_draft(
    client, *, from_cart_id: int, merge_strategy: str = "max"
) -> int:
    src = (
        Cart.objects.select_for_update()
        .filter(pk=from_cart_id, client=client, is_ordered=True)
        .first()
    )
    if not src:
        return 0

    dst = get_or_create_draft_cart(client)

    if merge_strategy == "replace":
        CartItem.objects.filter(cart=dst).delete()
        existing = {}
    else:
        existing = {ci.product_variant_id: ci.quantity for ci in cart_items_qs(dst)}

    moved = 0
    for it in CartItem.objects.filter(cart=src).select_related("product_variant"):
        vid = it.product_variant_id
        if merge_strategy == "sum":
            final_qty = existing.get(vid, 0) + it.quantity
        else:
            final_qty = max(existing.get(vid, 0), it.quantity)

        if final_qty > 0:
            db_cart_add_or_set(client, variant_id=vid, qty=final_qty)
            moved += 1

    return moved


@transaction.atomic
def sync_by_payment_or_order_id(ident: str) -> Dict[str, Any]:
    """
    Опросить T-Банк по PaymentId (если ident — число) или по OrderId (иначе).
    Обновить наш Payment и, если CONFIRMED/AUTHORIZED, отметить заказ оплаченным.
    Вернуть «сырое» тело ответа банка.
    """
    client = TBankClient()
    if ident.isdigit():
        resp = client.get_state(payment_id=ident)
    else:
        resp = client.get_state(order_id=ident)

    # обновим нашу запись Payment (если найдём)
    pay: Optional[Payment] = None
    pid = str(resp.get("PaymentId") or "")
    oid = str(resp.get("OrderId") or "")

    if pid:
        pay = (
            Payment.objects.select_for_update()
            .filter(payment_id=pid)
            .order_by("-id")
            .first()
        )
    if not pay and oid:
        pay = (
            Payment.objects.select_for_update()
            .filter(order_id=oid)
            .order_by("-id")
            .first()
        )

    if pay:
        pay.raw_last_callback = {
            **resp,
            "_synced": True,
            "_lookup": {"PaymentId": pid, "OrderId": oid},
        }
        if resp.get("Status"):
            pay.status = resp["Status"]
        pay.save(update_fields=["raw_last_callback", "status"])

        status_upper = str(resp.get("Status") or "").upper()
        if resp.get("Success") is True and status_upper in ("CONFIRMED", "AUTHORIZED"):
            order_mark_paid_by_id(pay.cart_id)

    return resp
