from django.contrib import admin
from django.contrib.admin import DateFieldListFilter
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "cart_id",
        "order_id",
        "payment_id",
        "status",
        "amount",
        "created_at",
    )
    search_fields = ("order_id", "payment_id", "cart_id")
    list_filter = ("status", ("created_at", DateFieldListFilter))
    readonly_fields = (
        "id",
        'payment_url',
        "cart_id",
        "order_id",
        "payment_id",
        "status",
        "amount",
        "created_at",
        "raw_init_resp",
        "raw_last_callback",
        "created_at",
        "updated_at",
    )
