from django.utils import timezone
from django.contrib import admin
from apps.orders.models import (
    Cart,
    CartItem,
)


admin.site.register(CartItem)

class CartItemInline(admin.StackedInline):
    model = CartItem
    
    extra = 0
    
    readonly_fields = (
        'product_variant',
        'quantity',
        )
    
    can_delete = False
    
    list_filter = (
        'product_variant',
    )
    show_change_link = True
    
    def get_fields(self, request, obj = None):
        return ('id', 'product_variant')

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'client',
        'cart_total_sum',
        'create_at',
    )
    
    readonly_fields = (
        'cart_total_sum',
    )

    search_fields = [
        'client__name',
        'client__surname',
    ]
    
    list_filter = (
        'status',
    )
    
    inlines = (
        CartItemInline,
    )

    def save_model(self, request, obj, form, change):
        if change:
            old_status = Cart.objects.get(
                pk=obj.pk
            ).status
            if old_status == 'draft' and obj.status == 'not_completed':
                obj.is_ordered = True
                obj.ordered_at = timezone.now()
        super().save_model(request, obj, form, change)