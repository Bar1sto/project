from __future__ import annotations

from typing import Optional

from apps.orders.selectors import get_or_create_draft_cart
from apps.orders.services import order_mark_paid_by_id
from apps.payments.clients import TBankClient
from apps.payments.models import Payment
from apps.payments.services import (
    apply_webhook,
    create_or_get_payment_for_cart,
    get_state_by_order,
    handle_callback,
)
from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class PaymentInitView(APIView):
    """
    Создаём платёж для текущей draft-корзины клиента.
    Плюс сохраняем адрес/способ получения из чекаута.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        try:
            cart = get_or_create_draft_cart(user.client)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data or {}
        delivery_type = data.get("delivery_type")  # "pickup" | "delivery"
        address = (data.get("address") or "").strip()
        address_comment = (data.get("address_comment") or "").strip()
        pickup_id = data.get("pickup_id")

        parts = []

        if delivery_type == "pickup":
            if address:
                parts.append(f"Самовывоз: {address}")
            if pickup_id:
                parts.append(f"Магазин ID={pickup_id}")
        elif delivery_type == "delivery":
            if address:
                parts.append(address)
            if address_comment:
                parts.append(f"Комментарий: {address_comment}")

        shipping_address = "\n".join(parts).strip()
        if shipping_address:
            cart.shipping_address = shipping_address
            cart.save(update_fields=["shipping_address"])

        try:
            payment = create_or_get_payment_for_cart(cart)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if not payment.payment_url:
            return Response(
                {"detail": "Не удалось получить ссылку на оплату"},
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
class TBankWebhookView(APIView):
    """
    Endpoint, на который T-Bank шлёт webhook (Notification URL).
    Банку достаточно текста 'OK' (200).
    """

    permission_classes = [AllowAny]

    def post(self, request):
        if request.content_type == "application/json":
            data = request.data
        else:
            data = request.POST.dict()
        text = apply_webhook(data)
        return HttpResponse(text, content_type="text/plain", status=200)


@method_decorator(csrf_exempt, name="dispatch")
class TBankCallbackView(APIView):
    """
    Альтернативный коллбэк (можно не использовать, но оставим).
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data if isinstance(request.data, dict) else {}
        try:
            handle_callback(data)
        except Exception:
            # не раскрываем детали внешним сервисам
            pass
        return Response({"result": "OK"}, status=200)


class PaymentStatusView(APIView):
    """
    Опрос состояния платежа по order_id (строка).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, order_id: str):
        # Прямо прокидываем в сервис. В случае необходимости он сам определит.
        resp = get_state_by_order(order_id)
        return Response(resp)


class PaymentStatusSmartView(APIView):
    """
    GET /api/payments/payments/status/<ident>
    ident = PaymentId (числа) ИЛИ OrderId (строка вида cart-...).

    1) спрашиваем банк
    2) сохраняем локально (Payment.status, raw_last_callback)
    3) если CONFIRMED — переводим корзину (order_mark_paid_by_id)
    Возвращаем ответ банка + признак, что синхронизировали локально.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, ident: str):
        client = TBankClient()

        # 1) запрос в банк
        if ident.isdigit():
            state = client.get_state(payment_id=ident)
        else:
            state = client.get_state(order_id=ident)

        pay_id = str(state.get("PaymentId") or "")  # из ответа банка
        ord_id = str(
            state.get("OrderId") or ident
        )  # либо из ответа, либо то что передали

        # 2) синхронизация в нашей БД
        synced = False
        with transaction.atomic():
            payment: Optional[Payment] = (
                Payment.objects.select_for_update()
                .filter(Q(payment_id=pay_id) | Q(order_id=ord_id) | Q(order_id=ident))
                .order_by("-id")
                .first()
            )

            if payment:
                old_status = payment.status
                new_status = (state.get("Status") or old_status) or "NEW"

                payment.raw_last_callback = state
                payment.status = new_status
                payment.save(update_fields=["raw_last_callback", "status"])
                synced = True

                # 3) если подтвердилось — фиксируем заказ
                if (
                    state.get("Success") in (True, "true", "True")
                ) and new_status == "CONFIRMED":
                    # если тут что-то упадёт — увидим стек, ничего не проглатываем
                    order_mark_paid_by_id(payment.cart_id)

        # отдадим ответ банка + флаг локальной синхронизации и то, как мы нашли платёж
        return Response(
            {
                **state,
                "_synced": synced,
                "_lookup": {"PaymentId": pay_id, "OrderId": ord_id},
            },
            status=200,
        )


print("T_BANK PASSWORD =", repr(settings.T_BANK["PASSWORD"]))
