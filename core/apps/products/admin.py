from django.contrib import admin
from apps.products.models import (
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
    
    save_on_top = True
    
    fieldsets = (
        (
            'Основная информация товара', {
                'fields': (
                    'name',
                    'description',
                    'sale',
                    'price',
                    'slug',
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
        'display_price',
        'is_active',
        'is_order',
    )
    
    readonly_fields = (
        'display_price',
    )
    
    list_select_related = (
        'product',
        )
    
    def display_price(self, obj):
        return obj.display_price
        
    display_price.short_description = 'Текущая цена'