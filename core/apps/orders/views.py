from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from apps.orders.services import (
    anon_cart_items,
    anon_cart_add,
    anon_cart_remove,
    anon_cart_change,
    build_cart_response_from_ids,
    anon_cart_clear,
)


class CartRetrieveView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        user_id = request.user.id if request.user.is_authenticated else None
        anon_id = None if user_id else request.headers.get(settings.RECENTLY_VIEWED["ANON_HEADER"])
        qty_map = anon_cart_items(user_id=user_id, anon_id=anon_id)
        items, total = build_cart_response_from_ids(qty_map)
        return Response(
            {
                "items": items,
                "total": total,
            }
        )
        
class CartItemSetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        variant_id = request.data.get("variant_id")
        qty = request.data.get("qty")
        if not isinstance(variant_id, int) or not isinstance(qty, int):
            return Response({"detail": "variant_id and qty must be integers"}, status=400)

        user_id = request.user.id if request.user.is_authenticated else None
        anon_id = None if user_id else request.headers.get(settings.RECENTLY_VIEWED["ANON_HEADER"])

        anon_cart_add(user_id=user_id, anon_id=anon_id, variant_id=variant_id, qty=qty)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class CartItemDeleteView(APIView):
    permission_classes = [AllowAny]

    def delete(self, request, variant_id: int):
        user_id = request.user.id if request.user.is_authenticated else None
        anon_id = None if user_id else request.headers.get(settings.RECENTLY_VIEWED["ANON_HEADER"])
        anon_cart_remove(user_id=user_id, anon_id=anon_id, variant_id=variant_id)
        return Response(status=status.HTTP_204_NO_CONTENT)

class CartMergeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = request.user.id
        anon_id = request.headers.get(settings.RECENTLY_VIEWED["ANON_HEADER"])
        if not anon_id:
            return Response({"detail": "no anon id"}, status=400)
        anon_map = anon_cart_items(user_id=None, anon_id=anon_id)
        user_map = anon_cart_items(user_id=user_id, anon_id=None)
        merged = user_map.copy()
        for vid, q in anon_map.items():
            merged[vid] = max(merged.get(vid, 0), q)
        for vid, q in merged.items():
            anon_cart_add(user_id=user_id, anon_id=None, variant_id=vid, qty=q)

        anon_cart_clear(user_id=None, anon_id=anon_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
