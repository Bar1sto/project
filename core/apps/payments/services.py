from __future__ import annotations
import time
import uuid
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional
from django.conf import settings
from django.http import HttpRequest
from django.db import transaction
from apps.payments.models import Payment
from apps.payments.tbank import make_token, tbank_post
from apps.orders.models import Cart
from apps.orders.services import order_mark_paid_by_id  


def _to_kopecks(amount: Decimal) -> int:
    # Decimal -> int копейки (округляем банковским способом)
    return int((amount * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

def _ensure_cart_amount(cart: Cart) -> int:
    """
    Берём сумму корзины из твоей модели (cart.total_sum), конвертируем в копейки.
    """
    total = cart.total_sum or Decimal("0.00")
    return _to_kopecks(total)

def _new_order_id(cart: Cart) -> str:
    # Уникальный для Init в рамках твоего магазина (для удобства трассировки)
    return f"c{cart.pk}-{int(time.time())}-{uuid.uuid4().hex[:6]}"

@transaction.atomic
def init_payment_for_cart(cart: Cart) -> Payment:
    """
    Инициализация платежа: создаём Payment у себя и вызываем /v2/Init.
    Возвращаем Payment с заполненным payment_url.
    """
    amount = _ensure_cart_amount(cart)
    order_id = _new_order_id(cart)

    pay = Payment.objects.create(
        cart_id=cart.pk,
        amount=amount,
        order_id=order_id,
        status="NEW",
    )

    payload = {
        "TerminalKey": settings.T_BANK["TERMINAL_KEY"],
        "Amount": amount,           # копейки, int
        "OrderId": order_id,        # твой номер
        "Description": f"Оплата заказа #{cart.pk}",
        # эти URL опциональны, фронт может сам обрабатывать — но положить можно:
        "SuccessURL": getattr(settings, "PAYMENTS_SUCCESS_URL", None),
        "FailURL": getattr(settings, "PAYMENTS_FAIL_URL", None),
        # дополнительные данные (если нужно):
        # "DATA": {"CustomerKey": str(cart.client_id) if cart.client_id else ""}
    }
    payload["Token"] = make_token(payload, settings.T_BANK["PASSWORD"])

    resp = tbank_post("Init", payload)  # POST /v2/Init
    # В документации для v2 описан Init + формирование токена и пр., см. «Прием платежей» + «Подпись запроса».  [oai_citation:6‡Т‑Банк](https://www.tbank.ru/kassa/dev/payments/)

    # Сохраним «как есть», это супер помогает в дебаге
    pay.raw_init_resp = resp

    # Нормальная ситуация — Success: true и поля PaymentURL / PaymentId
    pay.status = resp.get("Status") or pay.status
    pay.payment_url = resp.get("PaymentURL") or resp.get("PaymentUrl")
    pay.payment_id = str(resp.get("PaymentId")) if resp.get("PaymentId") is not None else None
    pay.save(update_fields=["raw_init_resp", "status", "payment_url", "payment_id"])
    return pay

def get_state_by_order(order_id: str) -> dict:
    """
    Обращаемся к /v2/GetState по OrderId (удобно для опроса статуса).
    """
    payload = {
        "TerminalKey": settings.T_BANK["TERMINAL_KEY"],
        "OrderId": order_id,
    }
    payload["Token"] = make_token(payload, settings.T_BANK["PASSWORD"])
    return tbank_post("GetState", payload)  # POST /v2/GetState  (см. доку про метод)  [oai_citation:7‡Т‑Банк](https://www.tbank.ru/kassa/dev/payments/)

@transaction.atomic
def apply_webhook(data: dict) -> str:
    """
    Обработка уведомления от T-Банк.
    - Проверяем подпись (Token)
    - Находим Payment и обновляем статус
    - Если статус 'CONFIRMED' — отмечаем заказ оплаченным
    Возвращаем строку-ответ для банка (обычно 'OK').
    """
    # 1) Валидация подписи
    expected = make_token(data.copy(), settings.T_BANK["PASSWORD"])
    if str(data.get("Token", "")).lower() != expected.lower():
        # Неверная подпись — отвечать 200, чтобы не заспамили, но можно вернуть не 'OK'
        return "INVALID TOKEN"

    # 2) Ищем платёж
    payment_id = str(data.get("PaymentId") or "")
    order_id = str(data.get("OrderId") or "")
    pay: Optional[Payment] = None

    if payment_id:
        pay = Payment.objects.filter(payment_id=payment_id).order_by("-id").first()
    if not pay and order_id:
        pay = Payment.objects.filter(order_id=order_id).order_by("-id").first()

    if not pay:
        # Можно логировать, но банку отвечаем 'OK', чтобы он не дудосил нас повторно
        return "OK"

    # 3) Обновляем платёж
    pay.raw_last_callback = data
    pay.status = data.get("Status") or pay.status
    pay.save(update_fields=["raw_last_callback", "status"])

    # 4) Если оплачен — подтверждаем заказ в нашей системе
    if (data.get("Success") in (True, "true", "True")) and str(data.get("Status")).upper() == "CONFIRMED":
        order_mark_paid_by_id(pay.cart_id)

    return "OK"