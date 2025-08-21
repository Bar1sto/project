from django.db.models.signals import (
    post_save,
    post_delete
)
from django.dispatch import receiver, Signal
from django.db import transaction
from apps.customers.models import (
    Promocode,
    PromocodeClient,
)
from apps.customers.services import (
    assign_promocode_to_all_clients,
    remove_promocode_from_all_clients,
)


@receiver(post_save, sender=Promocode)
def promocode_post_save(instance: Promocode, created, **kwargs):
    def _on_comit():
        if instance.is_active and not instance.is_personal:
            assign_promocode_to_all_clients(instance)
        else:
            remove_promocode_from_all_clients(instance)
    transaction.on_commit(_on_comit)
    
@receiver(post_delete, sender=Promocode)
def promocode_post_delete(sender, instance: Promocode, **kwargs):
    remove_promocode_from_all_clients(instance)
    
# client_registered = Signal(providing_args=["client"])
