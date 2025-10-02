from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from apps.payments.models import Payment
from apps.orders.services import order_mark_paid_by_id

@receiver(post_save, sender=Payment)
def payment_post_save_mark_order(sender, instance: Payment, created, **kwargs):
    if instance.status and str(instance.status).upper() == "CONFIRMED":
        try:
            order_mark_paid_by_id(instance.cart_id)
        except Exception:
            pass