from django.db.models import (
    Q,
    Min,
    Max,
    Count,
    Prefetch,
    Exists,
    OuterRef,
)
from django.db.models.functions import Coalesce
from apps.products.models import (
    Product,
    ProductVariant,
)


VARIANTS_RELATED_NAME = 'variants'

def base_products_qs():
    return (
        Product.objects.select_related('brand', 'category').filter(is_active=True)
    )
    
def with_list_annitations(qs, user=None):
    active_variants_filter = Q(**{f"{VARIANTS_RELATED_NAME}__is_active": True})
    qs = qs.annotate(
        min_price = Min(
            f"{VARIANTS_RELATED_NAME}__current_price",
            filter=active_variants_filter
        ),
        variants_count=Count(
            VARIANTS_RELATED_NAME,
            filter=active_variants_filter,
            distinct=True,
        ),
    )
    
    return qs

def get_products_list_qs(*, user=None):
    qs = base_products_qs()
    qs = with_list_annitations(qs, user=user)
    return qs

def get_product_detail_qs(*, user=None):
    active_variants = ProductVariant.objects.filter(is_active=True).order_by('id')
    
    qs = (
        base_products_qs().prefetch_related(
            Prefetch(
                VARIANTS_RELATED_NAME,
                queryset=active_variants)
            )
        .annotate(
                min_price=Min(
                    f"{VARIANTS_RELATED_NAME}__current_price",
                    filter=Q(**{f"{VARIANTS_RELATED_NAME}__is_active": True})
                ),
                max_price=Max(
                    f"{VARIANTS_RELATED_NAME}__current_price",
                    filter=Q(**{f"{VARIANTS_RELATED_NAME}__is_active": True})
                ),
            )
        )
    return qs
