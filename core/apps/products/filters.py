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
        method='filter_in_stock',
    )
    price_min = django_filters.NumberFilter(
        field_name='price',
        lookup_expr='gte'
    )
    price_max = django_filters.NumberFilter(
        field_name='price',
        lookup_expr='lte'
    )
    
    def filter_in_stock(self, queryset, name, value):
        if value is True:
            return queryset.filter(variants_count__gt=0)
        if value is False:
            return queryset.filter(variants_count__lte=0)
        return queryset
    
    class Meta:
        model = Product
        fields = []