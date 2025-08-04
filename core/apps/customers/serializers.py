from rest_framework import serializers
from apps.customers.models import (
    Client,
    Bonus,
)



class BonusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bonus
        fields = (
            'amount',
            'created_at',
            'expires_at',
            'is_active',
        )


class ClientSerializer(serializers.ModelSerializer):
    total_bonus = serializers.SerializerMethodField()
    bonuses = BonusSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Client
        fields = (
            'surname',
            'name',
            'phone_number',
            'email',
            'birthday',
            'image',
            'total_bonus',
            'bonuses',
            )
        
    def get_total_bonus(self, obj):
        return obj.total_bonus

