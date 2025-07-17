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
    '''Объект заказов у клиента'''
    model = Order
    extra = 0
    readonly_fields = ('order_total', 'create_at', 'status')
    can_delete = False
    list_filter = ('status',)
    show_change_link = True
    
    def get_fields(self, request, obj=None):
        return ('id', 'order_total', 'status')

class PromocodeClientInline(admin.StackedInline):
    model = PromocodeClient
    extra = 0
    readonly_fields = ('promocode',)
    can_delete = False
    show_change_link = True
    
    def get_fields(self, request, obj = None) :
        return ('promocode',)
    
    
class BonusInline(admin.StackedInline):
    '''Объект бонусов у клиента'''
    model = Bonus
    extra = 0
    readonly_fields = ('amount', 'created_at', 'expires_at')
    can_delete = False
    list_filter = ('is_active',)
    show_change_link = True
    
    def get_fields(self, request, obj = None):
        return ('id', 'amount')
    
@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    '''Класс клиенты'''
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
    
    inlines = [
        BonusInline,
        PromocodeClientInline,
        OrderInline
        ]
    

@admin.register(Bonus)
class BonusAdmin(admin.ModelAdmin):
    list_display = (
        'client',
        'amount',
        'created_at',
        'expires_at',
        'order',
        'is_active',
        
    )
    
    list_filter = [
        'is_active',
    ]
    

@admin.register(Promocode)
class PromocodeAdmin(admin.ModelAdmin):
    '''Класс промокод'''
    list_display = (
        'name',
        'last_day',
        'is_active',
        'is_personal',
    )
    
    list_filter = [
        'is_active',
        'is_personal'
        ]


@admin.register(PromocodeClient)
class PromocodeClientAdmin(admin.ModelAdmin):
    pass


@admin.register(PromocodeUsage)
class PromocodeUsage(admin.ModelAdmin):
    pass
