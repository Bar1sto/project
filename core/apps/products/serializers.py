from apps.products.models import (
    Brand,
    Category,
    Product,
    ProductVariant,
)
from rest_framework import serializers


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = (
            "id",
            "size_type",
            "size_value",
            "color",
            "current_price",
            "is_active",
            "is_order",
        )


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ("name",)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = (
            "name",
            "parent",
        )


class ProductSerializer(serializers.ModelSerializer):
    is_favorited = serializers.BooleanField(read_only=True)
    variants = ProductVariantSerializer(
        many=True,
        read_only=True,
    )
    brand = serializers.SlugRelatedField(
        read_only=True,
        slug_field="name",
    )
    category = serializers.SlugRelatedField(
        read_only=True,
        slug_field="name",
    )

    class Meta:
        model = Product
        fields = (
            "id",
            "slug",
            "name",
            "brand",
            "category",
            "description",
            "image",
            "is_sale",
            "is_new",
            "is_active",
            "is_hit",
            "sale",
            "price",
            "variants",
            "is_favorited",
        )


class ProductListSerializer(serializers.ModelSerializer):
    is_favorited = serializers.BooleanField(read_only=True)
    min_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    category_path = serializers.SerializerMethodField()
    sizes = serializers.SerializerMethodField()

    default_variant_id = serializers.SerializerMethodField()

    def get_default_variant_id(self, obj):
        vs = getattr(obj, "variants", None)
        if not vs:
            return None
        # первый активный вариант (можно усложнить по наличию/цене)
        v = vs.filter(is_active=True).first()
        return v.id if v else None

    def get_sizes(self, obj):
        vs = getattr(obj, "variants", None)
        if vs is None:
            return []
        vals = []
        for v in vs.all():
            if getattr(v, "size_value", None):
                vals.append(v.size_value)
        return sorted(set(vals), key=lambda x: str(x))

    def get_category_path(self, obj):
        cat = getattr(obj, "category", None)
        if not cat:
            return None
        names = []
        while cat:
            names.append(cat.name)
            cat = getattr(cat, "parent", None)
        return " - ".join(reversed(names))

    class Meta:
        model = Product
        fields = (
            "id",
            "slug",
            "name",
            "price",
            "image",
            "is_favorited",
            "min_price",
            "is_sale",
            "is_new",
            "is_hit",
            "sale",
            "category_path",
            "sizes",
            "default_variant_id",
        )
