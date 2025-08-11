from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.customers.models import Bonus
from apps.orders.models import Cart
from apps.customers.services import BonusService
import logging


logger = logging.getLogger(__name__)

@receiver(post_save, sender=Cart)
def handle_bonus_creation(sender, instance, created, **kwargs):
    if instance.status == 'not_completed' and not created:
        original = Cart.objects.get(
            pk=instance.pk
        )
        if original.status != 'not_completed':
            logger.info(f"Сигнал: обработка смены статуса для корзины {instance.id}")
            BonusService.create_from_order(instance)