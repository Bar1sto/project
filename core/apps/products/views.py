from rest_framework.views import APIView
from django.conf import settings
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import (
    JWTAuthentication,
)
from rest_framework.authentication import (
    SessionAuthentication,
)
from rest_framework import status
from django.conf import settings
from rest_framework.permissions import (
    IsAuthenticated,
    AllowAny,
)
from rest_framework.generics import (
    ListAPIView,
    RetrieveAPIView,
)
from apps.products.serializers import (
    ProductSerializer,
    ProductListSerializer,
)
from apps.products.models import(
    Product,
)
from apps.products.services import (
    get_request_client_or_raise,
    favorites_add,
    favorites_remove,
    favorites_products_qs,
    add_recent_view,
    get_recent_ids,
    products_preserve_order,
)
from apps.products.selectors import (
    get_products_list_qs,
    get_product_detail_qs,
)


class ProductListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer
    
    def get_queryset(self):
        return get_products_list_qs(user=self.request.user)
    
    
class ProductRetrieveView(RetrieveAPIView):
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [AllowAny]
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    
    def get_queryset(self):
        return get_product_detail_qs(user=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        user_id = request.user.id if request.user.is_authenticated else None
        annon_id = None if user_id else request.headers.get(settings.RECENTLY_VIEWED["ANON_HEADER"])
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
        product = Product.objects.filter(
            slug=slug,
            is_active=True
        ).first()
        if not product:
            return Response(
                {
                    'detail': 'product not found'
                },
                status=status.HTTP_404_NOT_FOUND
            )
        favorites_add(client, product=product)
        return Response(
            status=status.HTTP_204_NO_CONTENT
        )
    
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
            limit = int(request.query_params.get('limit', 10))
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
