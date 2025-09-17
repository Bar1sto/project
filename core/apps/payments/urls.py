from django.urls import path
from apps.payments.views import (
    PaymentInitView,
    TBankWebhookView,
    PaymentStatusView,
)

app_name = 'payments'

urlpatterns = [
    path('init/', PaymentInitView.as_view(), name='init'),
    
    path('webhook/', TBankWebhookView.as_view(), name='webhook'),
    
    path('status/<str:order_id>', PaymentStatusView.as_view(), name='status'),
]

