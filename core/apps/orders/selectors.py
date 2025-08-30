from apps.orders.models import (
    Cart,
    CartItem,
)
from django.db.models import Prefetch


def get_or_create_draft_cart(client) -> Cart:
    cart, _ = Cart.objects.get_or_create(
        client=client,
        is_ordered=False,
        defaults={
            'status': 'draft',
        },
    )
    return cart

def cart_items_qs(cart: Cart):
    return (CartItem.objects.select_related(
        'product_variant',
        'product_variant__product',
        'product_variant__product__brand',
        'product_variant__product__category',
    ).filter(cart=cart))