from django.contrib import admin
from .models import (
    Cart,
    Order,
    OrderItem,
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
    
    def delete_queryset(self, request, queryset):
        orders_to_update = set()
        for item in queryset:
            orders_to_update.add(item.order)
        
        super().delete_queryset(request, queryset)
        
        for order in orders_to_update:
            order.update_total()
    
    
@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = (
        'cart',
        'product',
    )