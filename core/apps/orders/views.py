from rest_framework.views import APIView
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from apps.orders.services import (
    anon_cart_add,
    anon_cart_remove,
    anon_cart_items,
    anon_cart_clear,
    build_cart_response_from_ids,
    db_cart_add_or_set,
    db_cart_remove,
    build_db_cart_response,
    merge_anon_cart_into_db_cart,
)


class CartRetrieveView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        if request.user.is_authenticated and getattr(request.user, 'client'):
            data = build_db_cart_response(request.user.client)
            return Response(data)
        anon_id = request.headers.get(settings.RECENTLY_VIEWED["ANON_HEADER"])
        qty_map = anon_cart_items(user_id=None, anon_id=anon_id)
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
        try:
            variant_id = int(request.data.get("variant_id"))
            qty = int(request.data.get("qty"))
        except (TypeError, ValueError):
            return Response({"detail": "variant_id and qty must be integers"}, status=400)

        if request.user.is_authenticated and hasattr(request.user, "client"):
            db_cart_add_or_set(request.user.client, variant_id=variant_id, qty=qty)
        else:
            anon_id = request.headers.get(settings.RECENTLY_VIEWED["ANON_HEADER"])
            anon_cart_add(user_id=None, anon_id=anon_id, variant_id=variant_id, qty=qty)

        return Response(status=status.HTTP_204_NO_CONTENT)

    
class CartItemDeleteView(APIView):
    permission_classes = [AllowAny]

    def delete(self, request, variant_id: int):
        if request.user.is_authenticated and hasattr(request.user, "client"):
            db_cart_remove(request.user.client, variant_id=variant_id)
        else:
            anon_id = request.headers.get(settings.RECENTLY_VIEWED["ANON_HEADER"])
            anon_cart_remove(user_id=None, anon_id=anon_id, variant_id=variant_id)
        return Response(status=status.HTTP_204_NO_CONTENT)

class CartMergeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        anon_id = request.headers.get(settings.RECENTLY_VIEWED["ANON_HEADER"])
        if not anon_id:
            return Response({"detail": "no anon id"}, status=400)
        if not hasattr(request.user, "client"):
            return Response({"detail": "client profile required"}, status=409)
        merge_anon_cart_into_db_cart(client=request.user.client, anon_id=anon_id)
        return Response(status=status.HTTP_204_NO_CONTENT)