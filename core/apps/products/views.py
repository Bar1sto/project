from apps.products.models import (
    Product,
)
from apps.products.selectors import (
    get_product_detail_qs,
    get_products_list_qs,
)
from apps.products.serializers import (
    ProductListSerializer,
    ProductSerializer,
)
from apps.products.services import (
    add_recent_view,
    favorites_add,
    favorites_products_qs,
    favorites_remove,
    get_recent_ids,
    get_request_client_or_raise,
    products_preserve_order,
)
from django.conf import settings
from rest_framework import status
from rest_framework.authentication import (
    SessionAuthentication,
)
from rest_framework.generics import (
    ListAPIView,
    RetrieveAPIView,
)
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import (
    JWTAuthentication,
)


class ProductListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer

    def get_queryset(self):
        qs = get_products_list_qs(user=self.request.user)
        qs = qs.order_by("-id")
        qp = self.request.query_params
        def truthy(v):
            return str(v).lower() in ("1", "true", "yes", "y", "on")
        if truthy(qp.get("popular")) or truthy(qp.get("is_hit")):
            qs = qs.filter(is_hit=True)

        if truthy(qp.get("is_new")):
            qs = qs.filter(is_new=True)

        if truthy(qp.get("is_sale")):
            qs = qs.filter(is_sale=True)
        try:
            limit = int(qp.get("limit")) if qp.get("limit") else None
        except ValueError:
            limit = None
        if limit:
            qs = qs[:limit]
        return qs


class ProductRetrieveView(RetrieveAPIView):
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [AllowAny]
    serializer_class = ProductSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return get_product_detail_qs(user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        user_id = request.user.id if request.user.is_authenticated else None
        annon_id = (
            None
            if user_id
            else request.headers.get(settings.RECENTLY_VIEWED["ANON_HEADER"])
        )
        add_recent_view(product_id=instance.id, user_id=user_id, annon_id=annon_id)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class FavoriteListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = ProductListSerializer

    def get_queryset(self):
        client = get_request_client_or_raise(self.request)
        return favorites_products_qs(client)


class FavoriteSetView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def put(self, request, slug):
        client = get_request_client_or_raise(request)
        product = Product.objects.filter(slug=slug, is_active=True).first()
        if not product:
            return Response(
                {"detail": "product not found"}, status=status.HTTP_404_NOT_FOUND
            )
        favorites_add(client, product=product)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, slug):
        client = get_request_client_or_raise(request)
        product = Product.objects.filter(slug=slug).first()
        if product:
            favorites_remove(client, product=product)
        return Response(status=status.HTTP_204_NO_CONTENT)


class RecentlyViewedListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        request = self.request
        try:
            limit = int(request.query_params.get("limit", 10))
        except ValueError:
            limit = 10

        if request.user.is_authenticated:
            user_id = request.user.id
            annon_id = None
        else:
            user_id = None
            annon_id = request.headers.get(settings.RECENTLY_VIEWED["ANON_HEADER"])

        ids = get_recent_ids(user_id=user_id, annon_id=annon_id, limit=limit)
        return products_preserve_order(ids)
