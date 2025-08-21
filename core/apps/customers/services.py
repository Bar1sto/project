from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError
from decimal import Decimal
from apps.customers.models import (
    Client,
    Promocode,
    PromocodeUsage,
    PromocodeClient,
)


User = get_user_model()

@transaction.atomic
def register_client(validated_date: dict) -> Client:
    try:
        email = validated_date.pop('email')
        password = validated_date.pop('password')
        
        user = User.objects.create_user(
            email=email,
            username=email,
            password=password
        )
        
        client = Client.objects.create(
            user=user,
            **validated_date
        )
        
        return client
    except Exception as e:
        raise ValidationError(str(e))


def update_client(instance, validated_data):
    for field, value in validated_data.items():
        setattr(
            instance,
            field,
            value
        )
    instance.save()     
    return instance

def calc_price_with_promocode(cart_total, code, client):
    today = timezone.now().date()
    
    try:
        promo = Promocode.objects.get(
            name=code,
            is_active=True,
            last_day__gte=today,
        )
        
    except Promocode.DoesNotExist:
        return cart_total, 'Промокод не найден или не активен', None
    
    if not PromocodeClient.objects.filter(client=client, promocode=promo).exists():
        return cart_total, 'Промокод недотупен для этого клиента', None
    
    if PromocodeUsage.objects.filter(
        client=client,
        promocode=promo
    ).exists():
        return cart_total, 'Промокод уже использован', None 
    
    if promo.amount:
        discount = (cart_total * Decimal(promo.amount)) // Decimal('100')
        new_total = cart_total - discount
    elif promo.sale:
        new_total = cart_total - Decimal(promo.sale)
    else:
        new_total = cart_total
    return max(new_total, Decimal('0.00')), None, promo


def mark_promocode_used(client, promocode):
    with transaction.atomic():
        PromocodeUsage.objects.create(
            client=client,
            promocode=promocode,
            used_at=timezone.now().date()
        )
        PromocodeClient.objects.filter(
            client=client,
            promocode=promocode,
        ).delete()
        

def assign_promocode_to_all_clients(promocode: Promocode):
    if not promocode.is_active or promocode.is_personal:
        return
    clients = Client.objects.all().only('id')
    
    for client in clients:
        PromocodeClient.objects.update_or_create(
            client=client,
            promocode=promocode,
            defaults={
                'promocode': promocode
            }
        )
        
def remove_promocode_from_all_clients(promocode):
    PromocodeClient.objects.filter(
        promocode=promocode,
    ).delete()
    
