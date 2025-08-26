from django.db.models.signals import (
    pre_save,
    post_save,
)
from django.dispatch import receiver
from apps.products.slugs import assign_product_slug
from apps.products.models import (
    Product,
    ProductVariant,
)
from apps.products.services import (
    compute_variant_current_price,
    bulk_recalc_variants_for_products,
)


@receiver(pre_save, sender=Product)
def product_pre_save_generate_slug(sender, instance: Product, **kwargs):
    if not instance.slug:
        assign_product_slug(instance)
        
        
@receiver(pre_save, sender=ProductVariant)
def variant_pre_save_set_current_price(sender, instance: ProductVariant, **kwargs):
    instance.current_price = compute_variant_current_price(instance)
    
    
@receiver(pre_save, sender=Product)
def product_pre_save_capture_old_sale(sender, instance: Product, **kwargs):
    if instance.pk:
        try:
            old = Product.objects.only('sale').get(pk=instance.pk)
            instance._old_sale = old.sale
        except Product.DoesNotExist:
            instance._old_sale = None
    else:
        instance._old_sale = None
        
@receiver(post_save, sender=Product)
def product_post_save_reprice_variants_on_sale_change(sender, instance: Product, **kwargs):
    if getattr(instance, "_old_sale", None) != instance.sale:
        bulk_recalc_variants_for_products(instance)