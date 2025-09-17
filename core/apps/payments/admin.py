from django.contrib import admin
from apps.payments.models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'cart_id',
        'order_id',
        'payment_id',
        'amount',
        'status',
        'created_at',
    )
    list_filter = (
        'status',
        'created_at',
    )
    search_fields = (
        'ordered_id',
        'payment_id',
        'cart_id',
    )