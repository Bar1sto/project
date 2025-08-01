from django.contrib import admin
from apps.orders.models import (
    Cart,
    CartItem,
)


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
    
    inlines = (
        CartItemInline,
    )
