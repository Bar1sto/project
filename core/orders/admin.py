from django.contrib import admin
from .models import (
    Cart,
    Order,
    OrderItem,
    CartItem,
)
from django.db import transaction



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
        'parent_order',
        'product',
        'item_quantity',
    )
    
    def delete_model(self, request, obj):
        obj.delete()

    def delete_queryset(self, request, queryset):
        with transaction.atomic():
            orders = Order.objects.filter(
                id__in=queryset.values_list('parent_order_id', flat=True)
            ).select_for_update()
            queryset.delete()
            for order in orders:
                order.update_total()
    
@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = (
        'cart',
        'product',
    )