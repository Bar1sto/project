from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
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


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        source='user.email',
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
    
    def create(self, validated_data):
        user_data = validated_data.pop('user', {})
        email = user_data.get('email')
        password = validated_data.pop('password', None)
        
        user = User.objects.create_user(
            email=email,
            username=email,
            password=password,
        )
        
        client = Client.objects.create(
            user=user,
            **validated_data,
        )
        
        return client 
    
    def validate_email(self, attrs):
        user_data = attrs.get('user', {})
        email = user_data.get('email')
        password = attrs.get('password')
        
        if not email:
            raise serializers.ValidationError({
                "email": "Почта обязательая для регистарции"
            })
        if not password:
            raise serializers.ValidationError(
               { 
                "password": "Пароль обязателен для регистрации"
                }
            )
        return attrs
    
    def get_tokens_user(user):
        if not user.is_active:
            raise AuthenticationFailed('Пользователь неактивен')
        
        refresh = RefreshToken.for_user(user)
        
        return{
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }