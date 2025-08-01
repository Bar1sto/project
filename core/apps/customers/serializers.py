from rest_framework import serializers
from apps.customers.models import (
    Client,
    Bonus,
    Promocode,
    PromocodeClient,
    PromocodeUsage,
)

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = (
            'surname',
            'name',
            'patronymic',
            'phone_number',
            'email',
            'birthday',
            'image',
            )
