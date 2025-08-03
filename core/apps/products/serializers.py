from rest_framework import serializers
from apps.products.models import (
    Product,
    ProductVariant,
)


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = (
            'size_type',
            'size_value',
            'color',
            'current_price',
            'is_active',
            'is_order',
        )
        
class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(
        many=True,
        read_only=True,
    )
    
    class Meta:
        model = Product
        fields = (
            'name',
            'brand',
            'category',
            'description',
            'image',
            'is_sale',
            'is_new',
            'is_active',
            'sale',
            'variants',
        )