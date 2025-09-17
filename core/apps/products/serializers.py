from rest_framework import serializers
from apps.products.models import (
    Product,
    ProductVariant,
    Category,
    Brand,
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
        
class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = (
            'name',
        )

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = (
            'name',
            'parent',
            )

class ProductSerializer(serializers.ModelSerializer):
    is_favorited = serializers.BooleanField(read_only=True)
    variants = ProductVariantSerializer(
        many=True,
        read_only=True,
    )
    brand = serializers.SlugRelatedField(
        read_only=True,
        slug_field='name',
    )
    category = serializers.SlugRelatedField(
        read_only=True,
        slug_field='name',
    )
    
    class Meta:
        model = Product
        fields = (
            'slug',
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
            'is_favorited',
        )
        
class ProductListSerializer(serializers.ModelSerializer):
    is_favorited = serializers.BooleanField(read_only=True)
    min_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )
    class Meta:
        model = Product
        fields = (
            'slug',
            'name',
            'price',
            'image',
            'is_favorited',
            'min_price',
        )