from django.urls import path
from apps.payments.views import (
    PaymentInitView,
    TBankWebhookView,
    TBankCallbackView,
    PaymentStatusView,
    PaymentStatusSmartView,
)

app_name = "payments"

urlpatterns = [
    path("init/", PaymentInitView.as_view(), name="init"),

    path("webhook/", TBankWebhookView.as_view(), name="webhook"),
    path("callback/", TBankCallbackView.as_view(), name="callback"),

    path("status/<str:order_id>", PaymentStatusView.as_view(), name="status"),

    path("payments/status/<path:ident>", PaymentStatusSmartView.as_view(), name="smart_status"),
]