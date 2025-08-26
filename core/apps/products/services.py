from decimal import Decimal
from django.db.models import (
    F,
    Value,
)
from django.db.models.functions import Cast
from apps.products.models import (
    Product,
    ProductVariant,
)


DEC_100 = Decimal("100")

def compute_variant_current_price(variant: ProductVariant) -> Decimal:
    sale = Decimal(variant.product.sale or 0)
    return (variant.base_price * (DEC_100 - sale)) / DEC_100

def bulk_recalc_variants_for_products(product: Product):
    ProductVariant.objects.filter(
        product=product
    ).update(
        current_price=F('base_price') * (Value(100) - Value(product.sale)) / Value(100)
    )