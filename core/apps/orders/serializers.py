from rest_framework import serializers
from apps.orders.models import (
    Cart,
    CartItem
)


class CartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = (
            'product_variant',
            'quantity',
        )

class CartSerializer(serializers.ModelSerializer):
    cart_items = CartItemSerializer(
        many=True,
        read_only=True,
    )
    class Meta:
        model = Cart
        fields = (
            'cart_total_sum',
            'cart_items',
        )