from __future__ import annotations
import time
import uuid
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, Optional

from django.utils import timezone
from django.db import transaction

from apps.payments.clients import TBankClient
from apps.payments.models import Payment
from apps.orders.models import Cart, CartItem
from apps.orders.services import order_mark_paid_by_id


# --- helpers ---------------------------------------------------------------

def _to_kopecks(amount: Decimal) -> int:
    """Decimal -> int (копейки), банковское округление."""
    return int((Decimal(amount) * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def _cart_items_qs(cart: Cart):
    """Берём позиции корзины без привязки к related_name."""
    return (
        CartItem.objects
        .filter(cart=cart)
        .select_related("product", "product_variant")
    )


def _get_cart_total_decimal(cart: Cart) -> Decimal:
    """
    Универсально получаем сумму корзины.
    1) Пытаемся взять известные поля, если вдруг есть (total_sum/total/...).
    2) Если нет — считаем вручную: (variant.current_price или product.price) * quantity.
    """
    candidates = ("total_sum", "total", "total_amount", "grand_total", "cart_total_sum")
    for name in candidates:
        if hasattr(cart, name):
            val = getattr(cart, name)
            if val is not None:
                try:
                    return Decimal(val)
                except Exception:
                    pass

    total = Decimal("0")
    for ci in _cart_items_qs(cart):
        # приоритет — цена варианта
        if getattr(ci, "product_variant", None) and getattr(ci.product_variant, "current_price", None) is not None:
            price = Decimal(ci.product_variant.current_price)
        elif getattr(ci, "product", None) and getattr(ci.product, "price", None) is not None:
            price = Decimal(ci.product.price)
        else:
            price = Decimal("0")
        qty = Decimal(ci.quantity or 0)
        total += (price * qty)

    return total.quantize(Decimal("0.01"))


# --- public API ------------------------------------------------------------

@transaction.atomic
def create_or_get_payment_for_cart(cart: Cart) -> Payment:
    """
    Идемпотентная инициализация платежа:
      - если у корзины уже есть «живой» платёж (NEW/FORM_SHOWED/AUTHORIZING) — вернём его;
      - иначе создадим новый, вызовем /v2/Init и сохраним PaymentURL/PaymentId.
    """
    cart.refresh_from_db()

    if not _cart_items_qs(cart).exists():
        raise ValueError("Корзина пуста")

    total = _get_cart_total_decimal(cart)
    if total <= 0:
        raise ValueError("Сумма платежа должна быть > 0")

    alive = ["NEW", "FORM_SHOWED", "AUTHORIZING"]
    existing = (
        Payment.objects.select_for_update()
        .filter(cart_id=cart.id, status__in=alive)
        .order_by("-id")
        .first()
    )
    if existing:
        return existing

    amount = _to_kopecks(total)  # в копейках
    order_id = f"cart-{cart.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"

    pay = Payment.objects.create(
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
    pay.raw_init_resp = init_resp

    if init_resp.get("Success"):
        pay.payment_id = str(init_resp.get("PaymentId") or "") or None
        pay.payment_url = init_resp.get("PaymentURL") or init_resp.get("PaymentUrl")
        pay.save(update_fields=["raw_init_resp", "payment_id", "payment_url"])
        return pay

    # ошибка с бэка T-Банка — зафиксируем и отдадим наружу
    pay.status = "REJECTED"
    pay.save(update_fields=["raw_init_resp", "status"])
    raise RuntimeError(f"T-Bank Init error: {init_resp}")


def get_state_by_order(order_id: str) -> Dict[str, Any]:
    """
    Опрос состояния платежа по нашему order_id (удобно для фронта как fallback).
    """
    client = TBankClient()
    return client.get_state(order_id=order_id)


def verify_tbank_token(payload: Dict[str, Any]) -> bool:
    """
    Валидация подписи коллбэка. Делаем токен теми же правилами, что и T-Банк.
    """
    client = TBankClient()
    expected = client._make_token(payload)
    return str(payload.get("Token", "")).lower() == expected.lower()


@transaction.atomic
def handle_callback(data: Dict[str, Any]) -> None:
    """
    Обработка «тихого» Callback (JSON): сохраняем коллбек, обновляем статус платежа,
    при CONFIRMED — отмечаем заказ «оплачен» (твоя логика).
    """
    if not verify_tbank_token(data):
        return

    payment_id = str(data.get("PaymentId") or "")
    order_id = str(data.get("OrderId") or "")
    status = str(data.get("Status") or "")

    pay: Optional[Payment] = None
    if payment_id:
        pay = Payment.objects.select_for_update().filter(payment_id=payment_id).first()
    if not pay and order_id:
        pay = Payment.objects.select_for_update().filter(order_id=order_id).first()
    if not pay:
        return

    pay.raw_last_callback = data
    pay.status = status or pay.status
    pay.save(update_fields=["raw_last_callback", "status"])

    if status.upper() == "CONFIRMED":
        # это вызовет твою бизнес-логику «перевести корзину в not_completed и т.п.»
        order_mark_paid_by_id(pay.cart_id)


@transaction.atomic
def apply_webhook(data: Dict[str, Any]) -> str:
    """
    Вариант хендлера, который возвращает строку — удобно для NotificationURL.
    """
    if not verify_tbank_token(data):
        return "INVALID TOKEN"

    payment_id = str(data.get("PaymentId") or "")
    order_id = str(data.get("OrderId") or "")
    status = str(data.get("Status") or "")

    pay: Optional[Payment] = None
    if payment_id:
        pay = Payment.objects.select_for_update().filter(payment_id=payment_id).first()
    if not pay and order_id:
        pay = Payment.objects.select_for_update().filter(order_id=order_id).first()
    if not pay:
        return "OK"

    pay.raw_last_callback = data
    pay.status = status or pay.status
    pay.save(update_fields=["raw_last_callback", "status"])

    if status.upper() == "CONFIRMED":
        order_mark_paid_by_id(pay.cart_id)

    return "OK"