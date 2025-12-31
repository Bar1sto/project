from apps.orders.models import Cart, CartItem
from rest_framework import serializers


class CartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = (
            "product_variant",
            "quantity",
        )


class CartSerializer(serializers.ModelSerializer):
    cart_items = CartItemSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Cart
        fields = (
            "cart_total_sum",
            "cart_items",
        )


class CarItemSetSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField()
    qty = serializers.IntegerField()


class MergeAnonSerializer(serializers.Serializer):
    pass


class CartHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Cart
        fields = (
            "id",
            "cart_total_sum",
            "ordered_at",
            "status",
        )
