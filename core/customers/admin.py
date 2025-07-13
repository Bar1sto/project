from django.contrib import admin
from .models import (
    Client,
    Bonus,
    Promocode,
    PromocodeClient,
    PromocodeUsage
    )

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    model = Client
    


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
