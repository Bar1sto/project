from django.db.models.signals import (
    pre_save,
    post_save,
    post_delete,
)
from django.dispatch import receiver
from django.db import (
    transaction,
)
from apps.orders.models import (
    Cart,
    CartItem,
)
from apps.orders.services import (
    cart_recalculate,
)


@receiver(pre_save, sender=Cart)
def cart_pre_save_capture_old_status(sender, instance: Cart, **kwargs):
    if instance.pk:
        try:
            old = Cart.objects.only('status', 'is_ordered').get(pk=instance.pk)
            instance._old_status = old.status
            instance._old_is_ordered = old.is_ordered
        except Cart.DoesNotExist:
            instance._old_status = None
            instance._old_is_ordered = False
    else:
        instance._old_status = None
        instance._old_is_ordered = False
    
        
@receiver(post_save, sender=CartItem)
def cart_item_post_save_recalc(sender, instance: CartItem, created: bool, **kwargs):
    cart = instance.cart
    transaction.on_commit(lambda: cart_recalculate(cart))
    
@receiver(post_delete, sender=CartItem)
def cart_item_post_delete_recalc(sender, instance: CartItem, **kwargs):
    cart = instance.cart
    transaction.on_commit(lambda: cart_recalculate(cart))