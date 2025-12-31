from decimal import Decimal, InvalidOperation

from apps.products.models import (
    Brand,
    Category,
    Product,
    ProductVariant,
)
from apps.products.services import compute_variant_current_price
from rest_framework import serializers

DEC_0 = Decimal("0")


def _safe_money(v):
    """
    Возвращаем строку с 2 знаками после запятой или None.
    Так фронту стабильнее (и DRF не упадёт на None).
    """
    if v is None:
        return None
    try:
        d = Decimal(str(v))
    except (InvalidOperation, TypeError, ValueError):
        return None
    return f"{d:.2f}"


def _safe_image_url(obj):
    """
    DRF ImageField иногда может упасть на `.url`, если в записи есть
    битый файл/пустое имя файла. Это не должно валить выдачу товара.
    """
    f = getattr(obj, "image", None)
    if not f:
        return None
    try:
        return f.url
    except Exception:
        return None


class ProductVariantSerializer(serializers.ModelSerializer):
    # вместо обычного DecimalField делаем безопасный метод
    current_price = serializers.SerializerMethodField()

    def get_current_price(self, obj: ProductVariant):
        # 1) если в БД уже есть current_price — отдаём его
        v = getattr(obj, "current_price", None)
        if v is not None:
            return _safe_money(v)

        # 2) если NULL — считаем на лету из base_price и product.sale
        try:
            v = compute_variant_current_price(obj)
        except Exception:
            v = None
        return _safe_money(v)

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
    variants = ProductVariantSerializer(many=True, read_only=True)

    brand = serializers.SlugRelatedField(read_only=True, slug_field="name")
    category = serializers.SlugRelatedField(read_only=True, slug_field="name")

    # безопасная картинка, чтобы не ловить 500 на битых файлах
    image = serializers.SerializerMethodField()

    def get_image(self, obj: Product):
        return _safe_image_url(obj)

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
        max_digits=10, decimal_places=2, read_only=True
    )

    category_path = serializers.SerializerMethodField()
    sizes = serializers.SerializerMethodField()
    default_variant_id = serializers.SerializerMethodField()

    # то же самое для списка — безопасная картинка
    image = serializers.SerializerMethodField()

    def get_image(self, obj: Product):
        return _safe_image_url(obj)

    def get_default_variant_id(self, obj):
        vs = getattr(obj, "variants", None)
        if not vs:
            return None
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
