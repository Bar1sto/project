import django_filters
from django.db.models import F
from apps.products.models import Product


class ProductFilter(django_filters.FilterSet):
    brand = django_filters.NumberFilter(
        field_name='brand_id',
        lookup_expr='exact',
    )
    category = django_filters.NumberFilter(
        field_name='category_id',
        lookup_expr='exact',
    )
    is_sale = django_filters.BooleanFilter(
        field_name='is_sale',
    )
    is_new = django_filters.BooleanFilter(
        field_name='is_new',
    )
    in_stock = django_filters.BooleanFilter(
        field_name='filter_in_stock',
    )
    
    