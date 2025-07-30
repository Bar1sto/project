from django.contrib import admin
from .models import (
    Cart,
    Order,
    OrderItem,
    CartItem,
)


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = (
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


class OrderItemInline(admin.StackedInline):
    model = OrderItem
    extra = 0
    readonly_fields = (
        'product_variant',
        'item_quantity',
    )
    can_delete = False
    list_filter = (
        'product_variant',
    )
    show_change_link = True
    
    def get_fields(self, request, obj = None):
        return ('id', 'product_variant')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'client',
        'order_total',
        'status',
        'create_at',
    )
    
    readonly_fields = (
        'order_total',
    )
    
    inlines = (OrderItemInline,)

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        'order',
        'product',
        'item_quantity',
    )
    
    
@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = (
        'cart',
        'product',
    )