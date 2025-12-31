from __future__ import annotations

from typing import Optional

from apps.orders.models import Cart
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
        resp = get_state_by_order(order_id)
        return Response(resp)


class PaymentStatusSmartView(APIView):
    """
    GET /api/payments/payments/status/<ident>
    ident = PaymentId (числа) ИЛИ OrderId (строка вида cart-...).

    1) спрашиваем банк
    2) сохраняем локально (Payment.status, raw_last_callback)
    3) если CONFIRMED — переводим корзину (order_mark_paid_by_id)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, ident: str):
        client = TBankClient()

        if ident.isdigit():
            state = client.get_state(payment_id=ident)
        else:
            state = client.get_state(order_id=ident)

        pay_id = str(state.get("PaymentId") or "")
        ord_id = str(state.get("OrderId") or ident)

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

                success_flag = state.get("Success") in (True, "true", "True", "1", 1)
                status_upper = str(new_status or "").upper()

                if success_flag and status_upper in ("CONFIRMED", "AUTHORIZED"):
                    order_mark_paid_by_id(payment.cart_id)

        return Response(
            {
                **state,
                "_synced": synced,
                "_lookup": {"PaymentId": pay_id, "OrderId": ord_id},
            },
            status=200,
        )


class PaymentSyncView(APIView):
    """
    Синхронизация статуса платежа.
    Вызывается с фронта со страницы /pay/success.

    ВАЖНО:
    - у Payment НЕТ FK cart, есть cart_id (int)
    - у Payment НЕТ paid_at/raw_state_resp, есть raw_last_callback/raw_init_resp
    """

    authentication_classes = []  # редирект с банка – без JWT
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.data or {}

        payment_id = (
            data.get("PaymentId")
            or data.get("payment_id")
            or data.get("paymentID")
            or data.get("PaymentID")
        )
        order_id = data.get("OrderId") or data.get("order_id") or data.get("orderId")

        if not payment_id and not order_id:
            return Response(
                {"detail": "payment_id_or_order_id_required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1) ищем локальный Payment
        payment = None
        if payment_id:
            payment = (
                Payment.objects.filter(payment_id=str(payment_id))
                .order_by("-id")
                .first()
            )
        if not payment and order_id:
            payment = (
                Payment.objects.filter(order_id=str(order_id)).order_by("-id").first()
            )

        if not payment:
            return Response(
                {"detail": "payment_not_found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # 2) опрашиваем банк: по PaymentId или по OrderId (с fallback внутри get_state_by_order)
        try:
            if payment_id:
                bank_state = TBankClient().get_state(payment_id=str(payment_id))
            else:
                bank_state = get_state_by_order(str(order_id))
        except Exception as e:
            return Response(
                {"detail": f"tbank_request_error: {e.__class__.__name__}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3) сохраняем статус/сырой ответ
        new_status = bank_state.get("Status") or payment.status or "NEW"
        payment.status = new_status
        payment.raw_last_callback = bank_state
        payment.save(update_fields=["status", "raw_last_callback"])

        success_flag = bank_state.get("Success") in (True, "true", "True", "1", 1)
        status_upper = str(new_status or "").upper()

        # 4) если успешно — сразу фиксируем заказ (status not_completed + is_ordered + бонусы)
        if success_flag and status_upper in ("CONFIRMED", "AUTHORIZED"):
            order_mark_paid_by_id(payment.cart_id)

        # 5) возвращаем данные (cart_total_sum берем из Cart)
        cart_total = "0.00"
        try:
            cart = Cart.objects.filter(pk=payment.cart_id).first()
            if cart:
                cart_total = str(cart.cart_total_sum or 0)
        except Exception:
            pass

        return Response(
            {
                "status": status_upper,
                "payment_id": payment.payment_id,
                "order_id": payment.order_id,
                "cart_id": payment.cart_id,
                "total": cart_total,
                "success": bool(success_flag),
            },
            status=status.HTTP_200_OK,
        )
