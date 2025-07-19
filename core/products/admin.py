from django.contrib import admin
from orders.models import Order
from .models import (
    ProductGroup,
    Brand,
    Category,
    Product,
    ProductAttribute,
    ProductAttributeValue,
    ProductVariant,
)

@admin.register(ProductGroup)
class ProductGroupAdmin(admin.ModelAdmin):
    list_display = (
        'name',
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
    
    
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'category',
        'brand',
        'is_active',
        'is_order',
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
                    'group',
                )
            }
        ),
        (
            'Детализация товара', {
                'fields': (
                    'is_active',
                    'is_order',
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


@admin.register(ProductAttribute)
class ProductAttributeAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'group',
    )
    
    
@admin.register(ProductAttributeValue)
class ProductAttributeValueAdmin(admin.ModelAdmin):
    list_display = (
        'product',
        'attribute',
        'value',
    )