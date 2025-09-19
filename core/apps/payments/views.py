from __future__ import annotations
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status, permissions
from apps.orders.models import Cart
from apps.orders.selectors import get_or_create_draft_cart
from apps.payments.services import (
    apply_webhook,
    get_state_by_order,
    create_or_get_payment_for_cart,
    handle_callback,
)


class PaymentInitView(APIView):
    """
    Создаём платёж для корзины:
    - если в теле есть cart_id -> берём её (проверяем, что принадлежит текущему клиенту и не оформлена)
    - иначе берём/создаём draft-корзину клиента
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        cart_id = request.data.get("cart_id")

        if cart_id:
            cart = Cart.objects.filter(
                pk=cart_id,
                client=user.client,
                is_ordered=False,
            ).first()
            if not cart:
                return Response({"detail": "Корзина не найдена"}, status=status.HTTP_404_NOT_FOUND)
        else:
            cart = get_or_create_draft_cart(user.client)

        try:
            payment = create_or_get_payment_for_cart(cart)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if not payment.payment_url:
            # если банк вернул ошибку — отдаём её телом, чтобы было видно «почему»
            return Response(
                {
                    "detail": "Не удалось получить ссылку на оплату",
                    "bank": payment.raw_init_resp or {},
                },
                status=400,
            )

        return Response(
            {
                "payment_id": payment.payment_id,
                "order_id": payment.order_id,
                "amount": payment.amount,
                "payment_url": payment.payment_url,
                "status": payment.status,
            },
            status=200,
        )

@method_decorator(csrf_exempt, name="dispatch")
class TBankCallbackView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        data = request.data if isinstance(request.data, dict) else {}
        try:
            handle_callback(data)
        except Exception:
            pass
        return Response({"result": "OK"}, status=200)

@method_decorator(csrf_exempt, name="dispatch")
class TBankWebhookView(APIView):
    """ Уведомления от Т-Банка (альтернативная точка). """
    permission_classes = [AllowAny]
    def post(self, request):
        data = request.data if request.content_type == "application/json" else request.POST.dict()
        text = apply_webhook(data)
        return HttpResponse(text, content_type="text/plain", status=200)

class PaymentStatusView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, order_id: str):
        state = get_state_by_order(order_id)
        return Response(state)