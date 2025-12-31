from decimal import Decimal

from apps.orders.models import Cart, CartItem
from apps.products.services import get_request_client_or_raise
from django.conf import settings
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from .selectors import cart_items_qs, get_or_create_draft_cart
from .services import (
    anon_cart_add,
    anon_cart_items,
    anon_cart_remove,
    build_cart_response_from_ids,
    build_db_cart_response,
    cart_recalculate,
    db_cart_add_or_set,
    db_cart_remove,
    merge_anon_cart_into_db_cart,
    repeat_order_into_draft,
)


def _anon_header_name() -> str:
    cfg = getattr(settings, "RECENTLY_VIEWED", None)
    return (cfg or {}).get("ANON_HEADER", "X-Anon-Id")


class CartRetrieveView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        if request.user.is_authenticated and hasattr(request.user, "client"):
            data = build_db_cart_response(request.user.client)
            return Response(data, status=status.HTTP_200_OK)

        anon_id = request.headers.get(_anon_header_name())
        qty_map = anon_cart_items(user_id=None, anon_id=anon_id)
        items, total = build_cart_response_from_ids(qty_map)
        return Response({"items": items, "total": total}, status=status.HTTP_200_OK)


class CartItemSetView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [JWTAuthentication]

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["variant_id", "qty"],
            properties={
                "variant_id": openapi.Schema(type=openapi.TYPE_INTEGER, example=42),
                "qty": openapi.Schema(type=openapi.TYPE_INTEGER, example=2),
            },
        )
    )
    def post(self, request):
        # 1. Жёстко валидируем вход
        try:
            variant_id = int(request.data.get("variant_id"))
            qty = int(request.data.get("qty"))
        except (TypeError, ValueError):
            return Response(
                {"detail": "variant_id and qty must be integers"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if qty < 0:
            qty = 0

        client = getattr(request.user, "client", None)

        try:
            if request.user.is_authenticated and client is not None:
                db_cart_add_or_set(client, variant_id=variant_id, qty=qty)
                data = build_db_cart_response(client)
            else:
                anon_id = request.headers.get(_anon_header_name())
                if not anon_id:
                    return Response(
                        {"detail": f"header {_anon_header_name()} required"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                anon_cart_add(anon_id=anon_id, variant_id=variant_id, qty=qty)
                qty_map = anon_cart_items(user_id=None, anon_id=anon_id)
                items, total = build_cart_response_from_ids(qty_map)
                data = {"items": items, "total": total}
        except Exception as e:
            import logging

            logging.getLogger(__name__).exception("CartItemSetView error")
            return Response(
                {"detail": f"cart_item_error: {e.__class__.__name__}: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(data, status=status.HTTP_200_OK)


class CartItemDeleteView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [JWTAuthentication]

    def delete(self, request, variant_id: int):
        if request.user.is_authenticated and hasattr(request.user, "client"):
            db_cart_remove(request.user.client, variant_id=variant_id)
        else:
            anon_id = request.headers.get(_anon_header_name())
            if not anon_id:
                return Response(
                    {"detail": f"header {_anon_header_name()} required"}, status=400
                )
            anon_cart_remove(anon_id=anon_id, variant_id=variant_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CartMergeView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        if not hasattr(request.user, "client"):
            return Response({"detail": "client profile required"}, status=409)
        anon_id = request.headers.get(_anon_header_name())
        if not anon_id:
            return Response(
                {"detail": f"header {_anon_header_name()} required"}, status=400
            )
        merge_anon_cart_into_db_cart(client=request.user.client, anon_id=anon_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CartRepeatView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "order_id",
                openapi.IN_PATH,
                description="ID ранее оформленного заказа",
                type=openapi.TYPE_INTEGER,
                required=True,
            )
        ]
    )
    def post(self, request, order_id: int):
        client = getattr(request.user, "client", None)
        if not client:
            return Response({"detail": "client profile required"}, status=409)

        moved = repeat_order_into_draft(
            client,
            from_cart_id=order_id,
            merge_strategy="replace",
        )
        return Response({"moved": moved}, status=status.HTTP_200_OK)


class OrderHistoryView(APIView):
    """
    История заказов: все корзины, которые были оформлены (is_ordered = True)
    для текущего клиента.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client = get_request_client_or_raise(request)

        carts = Cart.objects.filter(client=client, is_ordered=True).order_by(
            "-ordered_at", "-pk"
        )

        data = []
        for c in carts:
            data.append(
                {
                    "id": c.pk,
                    "number": c.pk,  # номер = id
                    "date": c.ordered_at.strftime("%d.%m.%Y") if c.ordered_at else "",
                    "total": float(c.cart_total_sum or 0),
                }
            )

        return Response(data, status=status.HTTP_200_OK)


class OrderDetailView(APIView):
    """
    Детали одного оформленного заказа (корзины).
    URL: /api/orders/history/<order_id>/
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id=None, *args, **kwargs):
        # поддерживаем оба варианта: <int:order_id> и <int:pk>
        if order_id is None:
            order_id = kwargs.get("order_id") or kwargs.get("pk")

        try:
            order_id = int(order_id)
        except (TypeError, ValueError):
            return Response(
                {"detail": "invalid_order_id"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # находим клиента (как в Product/Favorites)
        client = get_request_client_or_raise(request)

        # ищем оформленную корзину этого клиента
        try:
            cart = Cart.objects.get(
                pk=order_id,
                client=client,
                is_ordered=True,
            )
        except Cart.DoesNotExist:
            return Response(
                {"detail": "order_not_found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # собираем позиции заказа
        items_data = []
        total = Decimal("0.00")

        for ci in cart_items_qs(cart):
            v = ci.product_variant
            p = v.product

            price = v.current_price or v.price or Decimal("0")
            line_total = price * Decimal(ci.quantity or 0)
            total += line_total

            items_data.append(
                {
                    "variant_id": v.id,
                    "qty": ci.quantity,
                    "price": f"{price:.2f}",
                    "line_total": f"{line_total:.2f}",
                    "variant": {
                        "size_type": v.size_type,
                        "size_value": v.size_value,
                        "color": v.color,
                        "in_stock": v.is_active,
                        "is_order": getattr(v, "is_order", False),
                    },
                    "product": {
                        "slug": p.slug,
                        "name": p.name,
                        "image": (p.image.url if getattr(p, "image", None) else None),
                        "brand": (p.brand.name if p.brand_id else None),
                    },
                }
            )

        # если cart_total_sum не заполнено — берём посчитанный total
        cart_total = cart.cart_total_sum or total

        data = {
            "id": cart.pk,
            "number": cart.pk,
            "date": cart.ordered_at.strftime("%d.%m.%Y") if cart.ordered_at else "",
            "total": f"{cart_total:.2f}",
            "shipping_address": cart.shipping_address or "",
            "status": cart.status,
            "items": items_data,
        }

        return Response(data, status=status.HTTP_200_OK)


class OrderRepeatView(APIView):
    """
    Повторить заказ: переносим содержимое оформленного заказа
    в ТЕКУЩУЮ черновую корзину, предварительно её очистив.
    URL: /api/orders/repeat/<int:order_id>/
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id, *args, **kwargs):
        client = get_request_client_or_raise(request)

        try:
            source_cart = Cart.objects.get(
                pk=order_id,
                client=client,
                is_ordered=True,
            )
        except Cart.DoesNotExist:
            return Response(
                {"detail": "order_not_found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # берём / создаём черновую корзину
        draft = get_or_create_draft_cart(client)

        # ОЧИЩАЕМ черновую корзину, чтобы не мешались старые товары
        CartItem.objects.filter(cart=draft).delete()
        draft.promo_code = None
        draft.bonus_spent = Decimal("0")
        draft.cart_total_sum = Decimal("0")
        draft.save(update_fields=["promo_code", "bonus_spent", "cart_total_sum"])

        # копируем позиции из оформленного заказа
        for item in CartItem.objects.filter(cart=source_cart):
            CartItem.objects.create(
                cart=draft,
                product_variant=item.product_variant,
                quantity=item.quantity,
            )

        # пересчитываем сумму черновой корзины
        cart_recalculate(draft)

        return Response(
            {"cart_id": draft.id},
            status=status.HTTP_200_OK,
        )
