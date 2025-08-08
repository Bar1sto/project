from rest_framework import serializers, exceptions
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from django.contrib.auth.models import User
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
    email = serializers.EmailField(
        source='user.email',
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

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
    )
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
    )
    class Meta:
        model = Client
        fields = (
            'surname',
            'name',
            'patronymic',
            'phone_number',
            'birthday',
            'email',
            'password',
        )
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Пользователь с такой почтой уже существует!"
            )
        return value
    
    # def validate(self, attrs):
    #     if not attrs.get('password'):
    #         raise serializers.ValidationError(
    #            { 
    #             "password": "Пароль обязателен для регистрации"
    #             }
    #         )
    #     return attrs
    
    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            email=email,
            username=email,
            password=password,
        )
        
        client = Client.objects.create(
            user=user,
            **validated_data
        )
        return client
    
    def to_representation(self, instance):
        return {
            'id': instance.id,
            'name': instance.name,
            'surname': instance.surname,
            'phone_number': instance.phone_number,
            'message': 'Регистрация прошла успешно'
        }