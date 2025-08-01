from rest_framework import serializers
from .models import (
    Client,
    Bonus,
    Promocode,
    PromocodeClient,
    PromocodeUsage,
)

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            'pk',
            'surname',
            'name',
            'patronymic',
            'phone_number',
            'email',
            'birthday',
            'slug',
            'image',
            ]