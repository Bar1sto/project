from __future__ import annotations

import time
import uuid
from decimal import ROUND_HALF_UP, Decimal
from typing import Any, Dict, Optional

from apps.orders.models import Cart, CartItem
from apps.orders.services import order_mark_paid_by_id
from apps.payments.clients import TBankClient
from apps.payments.models import Payment
from django.conf import settings
from django.db import transaction
from django.utils import timezone

# --- helpers ---


def _to_kopecks(amount: Decimal) -> int:
    """Decimal -> int копейки (округляем банковским способом)."""
    return int((amount * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def _cart_items_qs(cart: Cart):
    return CartItem.objects.filter(cart=cart).select_related(
        "product", "product_variant"
    )


def _get_cart_total_decimal(cart: Cart) -> Decimal:
    """
    Универсально достаём сумму корзины:
    - пробуем разные поля;
    - считаем по позициям в корзине при необходимости.
    """
    candidates = ("total_sum", "total", "total_amount", "grand_total", "cart_total_sum")
    for name in candidates:
        val = getattr(cart, name, None)
        if val is not None:
            try:
                return Decimal(val)
            except Exception:
                pass

    # пробуем вызвать адаптерный метод если есть
    if hasattr(cart, "update_total"):
        try:
            cart.update_total()
            for name in candidates:
                val = getattr(cart, name, None)
                if val is not None:
                    return Decimal(val)
        except Exception:
            pass

    # фоллбэк — считаем вручную
    total = Decimal("0")
    for ci in _cart_items_qs(cart):
        price = None
        if (
            getattr(ci, "product_variant", None)
            and getattr(ci.product_variant, "current_price", None) is not None
        ):
            price = ci.product_variant.current_price
        elif (
            getattr(ci, "product", None)
            and getattr(ci.product, "price", None) is not None
        ):
            price = ci.product.price
        else:
            price = Decimal("0")
        total += Decimal(price) * Decimal(ci.quantity or 0)
    return total.quantize(Decimal("0.01"))


def _new_order_id(cart: Cart) -> str:
    return f"cart-{cart.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"


# --- T-Bank operations ---


@transaction.atomic
def create_or_get_payment_for_cart(cart: Cart) -> Payment:
    """
    Идемпотентно: получаем существующий "живой" платеж или создаём новый и вызываем Init.

    Логика:
    - корзина должна быть не пустой и с суммой > 0;
    - считаем текущую сумму корзины;
    - считаем amount в копейках;
    - если есть живой Payment с ТАКОЙ ЖЕ amount — переиспользуем его;
    - если живой Payment есть, но amount отличается — помечаем старый как REJECTED
      и создаём новый платёж в T-Bank.
    """
    cart.refresh_from_db()

    # проверяем, что в корзине есть позиции
    if not CartItem.objects.filter(cart=cart).exists():
        raise ValueError("Корзина пуста")

    # текущая сумма корзины (в рублях, Decimal)
    total = _get_cart_total_decimal(cart)
    if total <= 0:
        raise ValueError("Сумма платежа должна быть > 0")

    # сумма в копейках для T-Bank и для поля Payment.amount (как у тебя и было)
    amount = _to_kopecks(total)

    alive_statuses = ["NEW", "FORM_SHOWED", "AUTHORIZING"]

    # пытаемся найти живой платёж для ЭТОЙ корзины
    payment = (
        Payment.objects.select_for_update()
        .filter(cart_id=cart.id, status__in=alive_statuses)
        .order_by("-id")
        .first()
    )

    if payment:
        # если сумма совпадает и есть URL/ID — считаем платёж актуальным
        if payment.amount == amount and payment.payment_url and payment.payment_id:
            return payment

        # иначе считаем старый платёж неактуальным (сумма изменилась,
        # либо он был создан со старыми токенами и т.п.)
        payment.status = "REJECTED"
        payment.save(update_fields=["status"])

    # создаём НОВЫЙ платёж
    order_id = _new_order_id(cart)
    payment = Payment.objects.create(
        cart_id=cart.id,
        amount=amount,
        order_id=order_id,
        status="NEW",
    )

    client = TBankClient()
    init_resp = client.init(
        amount=amount,
        order_id=order_id,
        description=f"Оплата корзины #{cart.id}",
    )
    payment.raw_init_resp = init_resp

    if init_resp.get("Success"):
        payment.payment_id = str(init_resp.get("PaymentId") or "") or None
        payment.payment_url = init_resp.get("PaymentURL") or init_resp.get("PaymentUrl")
        payment.save(update_fields=["raw_init_resp", "payment_id", "payment_url"])
        return payment

    # ошибка инициализации — помечаем REJECTED и кидаем исключение
    payment.status = "REJECTED"
    payment.save(update_fields=["raw_init_resp", "status"])
    raise RuntimeError(f"T-Bank Init error: {init_resp}")


def get_state_by_order(order_id: str, payment_id: Optional[str] = None) -> dict:
    """
    Попытка получить статус у T-Bank по OrderId.
    Если T-Bank отвечает ошибкой 'PaymentId is required' — пробуем найти
    локально Payment по order_id и сделать GetState по PaymentId.
    """
    client = TBankClient()
    # Попытка прямого запроса по OrderId
    resp = client.get_state(order_id=order_id)
    # Если T-Bank ответил с ошибкой, что нужен PaymentId (ErrorCode 201) — попробуем локальную запись
    if resp.get("Success") is True or resp.get("ErrorCode") != "201":
        return resp

    # fallback: найти наш Payment и запросить по PaymentId
    from apps.payments.models import Payment

    pay = Payment.objects.filter(order_id=order_id).order_by("-id").first()
    if pay and pay.payment_id:
        return client.get_state(payment_id=str(pay.payment_id))
    return resp


# --- webhook / callback handling ---


def _verify_token_with_client(payload: Dict[str, Any]) -> bool:
    client = TBankClient()
    expected = client._make_token(dict(payload))
    return expected == payload.get("Token")


@transaction.atomic
def apply_webhook(data: Dict[str, Any]) -> str:
    """
    Обработка webhook (string/plain ответ). Проверяем подпись и обновляем Payment.
    Возвращает 'OK' или 'INVALID TOKEN'.
    """
    if not _verify_token_with_client(data):
        return "INVALID TOKEN"

    payment_id = str(data.get("PaymentId") or "")
    order_id = str(data.get("OrderId") or "")

    pay: Optional[Payment] = None
    if payment_id:
        pay = Payment.objects.filter(payment_id=payment_id).order_by("-id").first()
    if not pay and order_id:
        pay = Payment.objects.filter(order_id=order_id).order_by("-id").first()

    if not pay:
        return "OK"

    pay.raw_last_callback = data
    pay.status = data.get("Status") or pay.status
    pay.save(update_fields=["raw_last_callback", "status"])

    success_flag = data.get("Success") in (True, "true", "True", "1", 1)
    status_upper = str(data.get("Status") or "").upper()
    if success_flag and status_upper == "CONFIRMED":
        order_mark_paid_by_id(pay.cart_id)

    return "OK"


@transaction.atomic
def handle_callback(data: Dict[str, Any]) -> None:
    """
    Альтернативный обработчик callback (логика та же, но без возврата строки).
    Подписан под internal-view.
    """
    # verify token
    if not _verify_token_with_client(data):
        return

    payment_id = str(data.get("PaymentId") or "")
    order_id = str(data.get("OrderId") or "")
    status = data.get("Status") or ""

    payment = None
    if payment_id:
        payment = (
            Payment.objects.select_for_update().filter(payment_id=payment_id).first()
        )
    if not payment and order_id:
        payment = Payment.objects.select_for_update().filter(order_id=order_id).first()
    if not payment:
        return

    payment.raw_last_callback = data
    payment.status = status or payment.status
    payment.save(update_fields=["raw_last_callback", "status"])

    if str(status).upper() == "CONFIRMED":
        order_mark_paid_by_id(payment.cart_id)
