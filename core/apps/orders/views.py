from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .services import (
    anon_cart_add, anon_cart_remove, anon_cart_items, build_cart_response_from_ids,
    db_cart_add_or_set, db_cart_remove, build_db_cart_response,
    merge_anon_cart_into_db_cart, repeat_order_into_draft,
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
        try:
            variant_id = int(request.data.get("variant_id"))
            qty = int(request.data.get("qty"))
        except (TypeError, ValueError):
            return Response({"detail": "variant_id and qty must be integers"}, status=400)

        if request.user.is_authenticated and hasattr(request.user, "client"):
            db_cart_add_or_set(request.user.client, variant_id=variant_id, qty=qty)
        else:
            anon_id = request.headers.get(_anon_header_name())
            if not anon_id:
                return Response({"detail": f"header {_anon_header_name()} required"}, status=400)
            anon_cart_add(anon_id=anon_id, variant_id=variant_id, qty=qty)

        return Response(status=status.HTTP_204_NO_CONTENT)


class CartItemDeleteView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [JWTAuthentication]

    def delete(self, request, variant_id: int):
        if request.user.is_authenticated and hasattr(request.user, "client"):
            db_cart_remove(request.user.client, variant_id=variant_id)
        else:
            anon_id = request.headers.get(_anon_header_name())
            if not anon_id:
                return Response({"detail": f"header {_anon_header_name()} required"}, status=400)
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
            return Response({"detail": f"header {_anon_header_name()} required"}, status=400)
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

        moved = repeat_order_into_draft(client, from_cart_id=order_id, merge_strategy="max")
        return Response({"moved": moved}, status=status.HTTP_200_OK)