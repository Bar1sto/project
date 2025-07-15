from django.contrib import admin
from orders.models import Order
from .models import (
    Client,
    Bonus,
    Promocode,
    PromocodeClient,
    PromocodeUsage
    )


class OrderInline(admin.StackedInline):
    model = Order
    extra = 0
    readonly_fields = ('order_total', 'create_at', 'status')
    can_delete = False
    list_filter = ('status',)
    show_change_link = True
    
    def get_fields(self, request, obj=None):
        return ('id', 'order_total', 'status')


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'surname',
        'email',
        )
    
    fieldsets = (
        (
            'Основная информация', {
                'fields': (
                    'surname',
                    'name',
                    'patronymic',
                )
            }
        ),
        (
            'Персональные данные', {
                'fields': (
                    'phone_number',
                    'email',
                    'birthday',
                )
            }
        ),
        (
            'Фотография', {
                'fields': (
                    'image',
                )
            }
        )
    )
    
    search_fields = [
        'surname',
        'phone_number',
        'email',
    ]
    
    inlines = [OrderInline]
    

@admin.register(Bonus)
class BonusAdmin(admin.ModelAdmin):
    pass


@admin.register(Promocode)
class PromocodeAdmin(admin.ModelAdmin):
    pass


@admin.register(PromocodeClient)
class PromocodeClientAdmin(admin.ModelAdmin):
    pass


@admin.register(PromocodeUsage)
class PromocodeUsage(admin.ModelAdmin):
    pass
