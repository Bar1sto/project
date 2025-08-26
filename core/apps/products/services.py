from decimal import Decimal
from django.db.models import (
    F,
    Value,
)
from typing import Iterable
from apps.products.models import (
    Product,
    ProductVariant,
)
from apps.orders.models import (
    Cart,
    CartItem,
)


DEC_100 = Decimal("100")

def compute_variant_current_price(variant: ProductVariant) -> Decimal:
    sale = Decimal(variant.product.sale or 0)
    return (variant.base_price * (DEC_100 - sale)) / DEC_100

def bulk_recalc_variants_for_product(product: Product):
    ProductVariant.objects.filter(
        product=product
    ).update(
        current_price=F('base_price') * (Value(100) - Value(product.sale)) / Value(100)
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