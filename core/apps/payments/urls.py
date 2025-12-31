from apps.payments.views import (
    PaymentInitView,
    PaymentStatusSmartView,
    PaymentStatusView,
    PaymentSyncView,
    TBankCallbackView,
    TBankWebhookView,
)
from django.urls import path

app_name = "payments"

urlpatterns = [
    path("init/", PaymentInitView.as_view(), name="init"),
    path("webhook/", TBankWebhookView.as_view(), name="webhook"),
    path("callback/", TBankCallbackView.as_view(), name="callback"),
    path("status/<str:order_id>", PaymentStatusView.as_view(), name="status"),
    path("sync/", PaymentSyncView.as_view(), name="payment-sync"),
    path(
        "payments/status/<path:ident>",
        PaymentStatusSmartView.as_view(),
        name="smart_status",
    ),
]
