from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils.text import slugify
from apps.products.models import Product


@receiver(pre_save, sender=Product)
def generate_slug(sender, instance, **kwargs):
    if not instance.slug:
        instance.slug = slugify(instance.brand + instance.name)