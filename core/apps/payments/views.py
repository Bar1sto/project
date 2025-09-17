from __future__ import annotations
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from apps.orders.selectors import get_or_create_draft_cart
from apps.payments.serializers import PaymentInitResponseSerializer
from apps.payments.services import init_payment_for_cart, apply_webhook, get_state_by_order


class PaymentInitView(APIView):
    """
    Создаём платёж для текущей draft-корзины клиента.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        client = request.user.client
        cart = get_or_create_draft_cart(client)
        payment = init_payment_for_cart(cart)
        return Response(PaymentInitResponseSerializer(payment).data, status=status.HTTP_201_CREATED)

@method_decorator(csrf_exempt, name="dispatch")
class TBankWebhookView(APIView):
    """
    Webhook URL для T-Банк (AllowAny, без CSRF, по их требованиям).
    Банку достаточно ответа 'OK' (строка).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        if request.content_type == "application/json":
            data = request.data
        else:
            # На всякий случай, если банк пришлёт form-urlencoded (редко)
            data = request.POST.dict()
        text = apply_webhook(data)
        return HttpResponse(text, content_type="text/plain", status=200)

class PaymentStatusView(APIView):
    """
    Опрос статуса по нашему order_id (удобно для фронта в fallback-сценариях).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id: str):
        state = get_state_by_order(order_id)
        return Response(state)