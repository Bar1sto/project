from django.contrib import admin
from orders.models import Order
from .models import (
    Brand,
    Category,
    Product,
    ProductVariant,
)


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = (
        'name',
    )
    
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'parent',
    )
    

class ProductVariantInline(admin.StackedInline):
    model = ProductVariant
    extra = 0
    readonly_fields = (
        'size_type',
        'size_value',
        'color',
        'base_price',
        'current_price',
        'is_active',
        'is_order',
        )
    can_delete = False
    list_filter = (
        'size_type',
        'size_value',
        'is_active',
        'is_order',
    )
    show_change_link = True
    
    def get_fields(self, request, obj=None):
        return('id', 'is_active', 'is_order')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'category',
        'brand',
        'is_active',
        'is_new',
        'is_sale',
    )
    
    fieldsets = (
        (
            'Основная информация товара', {
                'fields': (
                    'name',
                    'description',
                    'sale',
                )
            }
        ),
        (
            'Категория, бренд и группа', {
                'fields': (
                    'category',
                    'brand',
                )
            }
        ),
        (
            'Детализация товара', {
                'fields': (
                    'is_active',
                    'is_sale',
                    'is_new',
                )
            }
        ),
        (
            'Фотография товара', {
                'fields': (
                    'image',
                )
            }
        )
    )
    
    search_fields = [
        'name',
        'brand__name',
    ]
    
    list_filter = [
        'is_active',
        'is_new',
        'brand',
        'category',
    ]

    inlines = [
        ProductVariantInline,
    ]

@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = (
        'product',
        'size_type',
        'size_value',
        'color',
        'base_price',
        'is_active',
        'is_order',
    )
    
    readonly_fields = (
        'current_price_display',
    )
    
    def current_price_display(self, obj):
        return obj.current_price
    current_price_display.short_description = 'Текущая цена'