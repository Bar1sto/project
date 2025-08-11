from django.utils import timezone
from decimal import Decimal
from django.db import transaction
from apps.customers import models
from .models import Bonus
import logging


logger = logging.getLogger(__name__)

class BonusService:
    
    @staticmethod
    def create_from_order(cart):
        if not cart.is_ordered or cart.status != 'not_completed':
            logger.warning(
                f'Корзина {cart.id} - некорректный статус для бонусов'
            )
            return None
        if not cart.client:
            logger.warning(
                f'Корзина {cart.id} - нет привязанного клиента'
            )
            return None
        if cart.total_sum <= 0:
            logger.warning(
                f'Корзина {cart.id} - бонусы уже начислены'
            )
            return None
        
        if Bonus.objects.filter(
            order=cart
        ).exists():
            logger.warning(f"Cart {cart.id} - бонусы уже начислены")
            return None
        
        bonus_amount = cart.total_sum * Decimal('0.05')
        
        try:
            with transaction.atomic():
                return Bonus.objects.create(
                    client=cart.client,
                    amount=bonus_amount,
                    order=cart,
                    expires_at=timezone.now() + timezone.timedelta(days=365)
                )
        except Exception as e:
            logger.error(f"Ошибка создания бонусов: {str(e)}")
            return None
    
    @staticmethod
    def get_active_bonuses(client):
        return Bonus.objects.filter(
            client=client,
            is_active=True,
            expires_at__gt=timezone.now()
        ).order_by('expires_at')
        
    @staticmethod
    def calculate_total_bonus(client):
        active_bonuses = BonusService.get_active_bonuses(
            client
        )
        return active_bonuses.aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0')
        
    @staticmethod
    def spend_bonuses(client, amount):
        if amount <= 0:
            return Decimal('0')

        bonuses = BonusService.get_active_bonuses(client)
        remaining = Decimal(str(amount))
        spent = Decimal('0')
        
        with transaction.atomic():
            for bonus in bonuses:
                if remaining <= 0:
                    break
                spend_amount = min(bonus.amount, remaining)
                bonus.amount -= spend_amount
                bonus.save()
                
                if bonus.amount <= 0:
                    bonus.is_active = False
                    bonus.save()
                
                remaining -= spend_amount
                spent += spend_amount
                
        return spent