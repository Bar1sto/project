from django.db.models.signals import pre_save
from django.dispatch import receiver
from apps.products.slugs import assign_product_slug
from apps.products.models import Product


@receiver(pre_save, sender=Product)
def product_pre_save_generate_slug(sender, instance: Product, **kwargs):
    if not instance.slug:
        assign_product_slug(instance)