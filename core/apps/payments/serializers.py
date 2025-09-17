from rest_framework import serializers
from apps.payments.models import Payment


class PaymentInitResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            'id',
            'order_id',
            'payment_id'
            'status',
            'payment_url',
            'amount',
            'cart_id',
        )