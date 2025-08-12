from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.validators import (
    RegexValidator,
    MinLengthValidator,
    MaxLengthValidator
    )
from django.db import transaction
from django.contrib.auth.models import User
from apps.customers.models import (
    Client,
    Bonus,
)
import re


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

class ClientRegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
    )
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        validators=[
            MinLengthValidator(8),
            RegexValidator(
                r'[A-Z]',
                'Пароль должен содержать хотя бы одну заглавную букву!'
            ),
            RegexValidator(
                r'[!@#$%^&*(),.?":{}|<>]',
                'Пароль должен содержать хотя бы один специальный символ!'
            ),
            RegexValidator(
                r'\d',
                'Пароль должен содержать хотя бы одну цифру!'
            ),
            MaxLengthValidator(16),
        ],
    )
    password2 = serializers.CharField(
        write_only=True,
        style={
            'input_type': 'password',
        },
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
            'password2',
        )
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Пользователь с такой почтой уже существует!"
            )
        return value
    
    def validate(self, attrs: list) -> list:
        password = attrs.get('password')
        password2 = attrs.pop('password2', None)
        
        if password != password2:
            raise serializers.ValidationError(
                {
                    "password2": "Пароли должны совпадать!"
                }
            )
        try:
            validate_password(password)
        except serializers.ValidationError as e: 
            raise serializers.ValidationError(
            {
                "password": e.messages
            }
        )
        
        return attrs
        
    def validate_phone_number(self, value):
        digits = re.sub(
            r'\D',
            '',
            value,
        )
        
        if digits.startswith('8'):
            digits = '7' + digits[1:]
        if not digits.startswith('7'):
            raise serializers.ValidationError(
                'Номер телефона должен начинаться с 7 или 8'
            )
        phone_number = '+' + digits
        
        if Client.objects.filter(
            phone_number=phone_number
            ).exists():
            raise serializers.ValidationError(
                'Такой номер телефона уже существует!'
            )
        return phone_number
    
    @transaction.atomic
    def create(self, validated_data):
        try:
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
        except Exception as e:
            raise serializers.ValidationError(str(e))
    
    def to_representation(self, instance):
        refresh = RefreshToken.for_user(instance.user)
        return {
            'id': instance.id,
            'name': instance.name,
            'surname': instance.surname,
            'phone_number': instance.phone_number,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'message': 'Регистрация прошла успешно'
        }

class ClientUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
    )
    class Meta:
        model = Client
        fields = [
            'surname',
            'name',
            'patronymic',
            'phone_number',
            'birthday',
            'email',
            'image',
        ]
        
        
    def validate_email(self, value):
        if User.objects.exclude(id=self.instance.user.id).filter(email=value).exists():
            raise serializers.ValidationError(
                "Пользователь с такой почтой уже существует!"
            )
        return value
    
    
    def validate_phone_number(self, value):
            digits = re.sub(
                r'\D',
                '',
                value,
            )
            
            if digits.startswith('8'):
                digits = '7' + digits[1:]
            if not digits.startswith('7'):
                raise serializers.ValidationError(
                    'Номер телефона должен начинаться с 7 или 8'
                )
            phone_number = '+' + digits
            
            if Client.objects.exclude(id=self.instance.id).filter(
                phone_number=phone_number
                ).exists():
                raise serializers.ValidationError(
                    'Такой номер телефона уже существует!'
                )
            return phone_number
        
    def update(self, instance, validated_data):
        instance.surname = validated_data.get('surname',instance.surname)
        instance.name = validated_data.get('name', instance.name)
        instance.patronymic = validated_data.get('patronymic', instance.patronymic)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.birthday = validated_data.get('birthday', instance.birthday)
        instance.image = validated_data.get('image', instance.image)
        
        instance.save()
        
        user = instance.user
        email = validated_data.get('email', None)
        
        if email and user.email != email:
            user.email = email
            user.username = email
            user.save()
        
        return instance