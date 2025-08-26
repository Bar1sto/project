from django.db.models import (
    Q,
    Count,
    Prefetch,
    
)
from apps.products.models import (
    Product,
    ProductVariant,
)


VARIANTS_RELATED_NAME = 'variants'

def base_products_qs():
    return (
        Product.objects.select_related('brand', 'category').filter(is_active=True)
    )
    
def with_list_annotations(qs, user=None):
    active_variants = Q(**{f"{VARIANTS_RELATED_NAME}__is_active": True})
    return qs.annotate(
        variants_count=Count(
            VARIANTS_RELATED_NAME,
            filter=active_variants,
            distinct=True,
        ),
    )
    
def get_products_list_qs(*, user=None):
    qs = base_products_qs()
    qs = with_list_annotations(qs, user=user)
    return qs

def get_product_detail_qs(*, user=None):
    active_variants_qs = ProductVariant.objects.filter(is_active=True).order_by('id')
    qs = (base_products_qs().prefetch_related(
        Prefetch(
            VARIANTS_RELATED_NAME, queryset=active_variants_qs
        )
    ))
    
    return qs