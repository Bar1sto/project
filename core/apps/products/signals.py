from django.db.models.signals import (
    pre_save,
    post_save,
    post_delete,
)
from django.db import transaction
from django.dispatch import receiver
from apps.products.slugs import assign_product_slug
from apps.products.models import (
    Product,
    ProductVariant,
)
from apps.products.services import (
    compute_variant_current_price,
    bulk_recalc_variants_for_product,
    cart_ids_for_product,
    cart_ids_for_variant,
    update_carts,
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
        
        
@receiver(post_save, sender=ProductVariant)
def variant_post_save_update_carts(sender, instance: ProductVariant, created, **kwargs):
    transaction.on_commit(lambda: update_carts(cart_ids_for_variant(instance)))
    
    
@receiver(post_delete, sender=ProductVariant)
def variant_post_delete_update_carts(sender, instance: ProductVariant, **kwargs):
    transaction.on_commit(lambda: update_carts(cart_ids_for_variant(instance)))
    
    
@receiver(post_save, sender=Product)
def product_post_save_reprice_and_update_carts(sender, instance: Product, created, **kwargs):
    sale_changed = (getattr(instance, "_old_sale", None) != instance.sale)
    if not sale_changed:
        return
    def _do():
        bulk_recalc_variants_for_product(instance)
        update_carts(cart_ids_for_product(instance))
    
    transaction.on_commit(_do)