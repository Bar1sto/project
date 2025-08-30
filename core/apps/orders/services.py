from django.utils import timezone
from django.db import transaction
from decimal import Decimal
from django_redis import get_redis_connection
from django.conf import settings
from apps.orders.models import (
    Cart,
)
from apps.customers.models import Bonus
from apps.products.models import (
    ProductVariant,
)
from apps.orders.models import (
    CartItem,
    Cart,
)
from apps.orders.selectors import (
    get_or_create_draft_cart,
    cart_items_qs,
)


def cart_recalculate(cart: Cart) -> None:
    cart.update_total()
    
def order_mark_paid_by_id(cart_id: int) -> None:
    with transaction.atomic():
        cart = Cart.objects.select_for_update().get(pk=cart_id)

        if cart.status != 'not_completed':
            return
        if cart.is_ordered:
            return
        now = timezone.now()
        
        cart.is_ordered = True
        cart.ordered_at = now
        cart.save(update_fields=[
            'is_ordered',
            'ordered_at',
        ])
        created = Bonus.create_from_order(cart)

        if created is None and cart.client and cart.total_sum > 0:
            if not Bonus.objects.filter(order=cart).exists():
                try:
                    Bonus.objects.create(
                        client=cart.client,
                        amount=cart.total_sum * Decimal('0.05'),
                        order=cart,
                        expires_at=timezone.now() + timezone.timedelta(days=365),
                    )
                except Exception:
                    pass

        cart_recalculate(cart)
        
def _cart_conn():
    return get_redis_connection('cart')

def _cart_key(*, user_id: int | None, anon_id: str | None) -> str | None:
    if user_id:
        return f"cart:u:{user_id}"
    if anon_id:
        return f"cart:a:{anon_id}"
    return None

def _cart_ttl_seconds() -> int:
    return settings.RECENTLY_VIEWED["TTL_SECONDS"]

def anon_cart_add(*, user_id: int | None, anon_id: str | None, variant_id: int, qty: int) -> None:
    key = _cart_key(user_id=user_id, anon_id=anon_id)
    if not key:
        return
    conn = _cart_conn()
    if qty <= 0:
        conn.hdel(key, variant_id)
    else:
        conn.hset(key, variant_id, qty)
    conn.expire(key, _cart_ttl_seconds())
    
def anon_cart_change(*, user_id: int | None, anon_id: str | None, variant_id: int, delta: int) -> int:
    key = _cart_key(user_id=user_id, anon_id=anon_id)
    if not key:
        return 0
    conn = _cart_conn()
    new_qry = conn.hincrby(key, variant_id, delta)
    if new_qry <= 0:
        conn.hdel(key, variant_id)
        new_qry = 0
    conn.expire(key, _cart_ttl_seconds())
    return new_qry

def anon_cart_remove(*, user_id: int | None, anon_id: str | None, variant_id: int) -> None:
    key = _cart_key(user_id=user_id, anon_id=anon_id)
    if not key:
        return
    conn = _cart_conn()
    conn.hdel(key, variant_id)
    conn.expire(key, _cart_ttl_seconds())
    
def anon_cart_items(*, user_id: int | None, anon_id: str | None) -> dict[int, int]:
    key = _cart_key(user_id=user_id, anon_id=anon_id)
    if not key:
        return {}
    conn = _cart_conn()
    raw = conn.hgetall(key)
    out: dict[int, int] = {}
    for k, v in raw.items():
        try:
            out[int(k)] = int(v)
        except (TypeError, ValueError):
            continue
    return out

def anon_cart_clear(*, user_id: int | None, anon_id: str | None) -> None:
    key = _cart_key(user_id=user_id, anon_id=anon_id)
    if not key:
        return
    conn = _cart_conn()
    conn.delete(key)

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

def build_cart_response_from_ids(qty_map: dict[int, int]) -> tuple[list[dict], str]:
    if not qty_map:
        return [], "0.00"
    variant_ids = list(qty_map.keys())
    variants = (
        ProductVariant.objects.select_related("product", "product__brand", "product__category").filter(pk__in=variant_ids)
    )
    items = []
    total = Decimal('0')
    for v in variants:
        qty = max(0, int(qty_map.get(v.id, 0)))
        if qty == 0:
            continue
        price = v.current_price or Decimal('0')
        line_total = price * qty
        total += line_total
        items.append({
            "variant_id": v.id,
            "qty": qty,
            "price": f"{price:.2f}",
            "line_total": f"{line_total:.2f}",
            "product": {
                "slug": v.product.slug,
                "name": v.product.name,
                "image": getattr(v.product, "image", None) and v.product.image.url or None,
                "brand": v.product.brand.name if v.product.brand_id else None,
            }
        })
    return items, f"{total:.2f}"

def db_cart_add_or_set(client, *, variant_id: int, qty: int) -> None:
    cart = get_or_create_draft_cart(client)
    if qty <= 0:
        CartItem.objects.filter(
            cart=cart,
            product_variant_id=variant_id
        ).delete()
        
    variant = ProductVariant.objects.select_related('product').filter(pk=variant_id).first()
    if not variant or not variant.product.is_active:
        return
    obj, created = CartItem.objects.get_or_create(
        cart=cart,
        product=variant.product,
        product_variant=variant,
        defaults={
            'quantity': qty,
        },
    )
    if not created:
        obj.quantity = qty,
        obj.save(update_fields=['quantity'])
        
def db_cart_remove(client, *, variant_id: int) -> None:
    cart = get_or_create_draft_cart(client)
    CartItem.objects.filter(
        cart=cart,
        product_variant=variant_id,
    ).delete()
    
def db_cart_clear(client) -> None:
    cart = get_or_create_draft_cart(client)
    CartItem.objects.filter(cart=cart).delete()
    
def build_db_cart_response(client) -> dict:
    cart = get_or_create_draft_cart(client)
    items_qs = cart_items_qs(cart)
    
    items = []
    total = Decimal('0')
    for ci in items_qs:
        v = ci.product_variant
        price = v.current_price or Decimal('0')
        line_total = price * ci.quantity
        total += line_total
        p = v.product
        items.append({
            'variant_id': v.id,
            'qty': ci.quantity,
            'price': f'{price:.2f}',
            'line_total': f'{line_total:.2f}',
            'product': {
                'slug': p.slug,
                'name': p.name,
                'image': getattr(p, 'image', None) and p.image.url or None,
                'brand': p.brand.name if p.brand_id else None,
            }
        })
    return {
        'items': items,
        'total': f'{total:.2f}',
    }
    