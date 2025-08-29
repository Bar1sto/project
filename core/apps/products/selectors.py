from django.db.models import (
    Q,
    Count,
    Prefetch,
    Exists,
    OuterRef,
    Value,
    BooleanField,
    Min,
    
)
from apps.products.models import (
    Product,
    ProductVariant,
    Favorite,
)


VARIANTS_RELATED_NAME = 'variants'

def base_products_qs():
    return (
        Product.objects.select_related('brand', 'category').filter(is_active=True)
    )
    
def _annotate_is_favorited(qs, user):
    if user and getattr(user, 'is_authenticated', False) and getattr(user, 'client_id', None):
        subq = Favorite.objects.filter(client_id=user.client_id, product_id=OuterRef("pk"))
        return qs.annotate(is_favorited=Exists(subq))
    return qs.annotate(is_favorited=Value(False, output_field=BooleanField()))

def with_list_annotations(qs, user=None):
    active_variants = Q(**{f"{VARIANTS_RELATED_NAME}__is_active": True})
    qs = qs.annotate(
        variants_count=Count(
            VARIANTS_RELATED_NAME,
            filter=active_variants,
            distinct=True,
        ),
        min_price=Min(
            f"{VARIANTS_RELATED_NAME}__current_price",
            filter=active_variants,
        )
    )
    qs = _annotate_is_favorited(qs, user)
    return qs
    
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
    qs = _annotate_is_favorited(qs, user)
    
    return qs