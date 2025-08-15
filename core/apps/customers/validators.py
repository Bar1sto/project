import re
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from apps.customers.models import Client

User = get_user_model()

def validate_email_unique(value):
    if User.objects.filter(email=value).exists():
        raise ValidationError(
            "Пользователь с такой почтой уже существует!"
        )
    return value


def validate_password_match(password, password2):
    if password != password2:
        raise ValidationError(
            {
                 "password2": "Пароли должны совпадать!"
            }
        )
    try:
        validate_password(password)
    except DjangoValidationError as e:
        raise ValidationError(
            {
                "password": e.message
            }
        )
    return password

def validate_phone_number_unique(value, instance_id=None):
    digits = re.sub(
            r'\D',
            '',
            value,
        )
    if digits.startswith('8'):
        digits = '7' + digits[1:]
    if not digits.startswith('7'):
        raise ValidationError(
            'Номер телефона должен начинаться с 7 или 8'
        )
    phone_number = '+' + digits
    qs = Client.objects.all()
    if instance_id:
        qs = qs.exclude(id=instance_id)
    if qs.filter(phone_number=phone_number).exists():
        raise ValidationError ('Такой номер телефона уже существует!')
    
    return phone_number