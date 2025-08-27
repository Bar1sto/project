from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
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
)


class ProductListView(ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductListSerializer
    
    
class ProductRetrieveView(RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    
class FavoriteListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProductListSerializer
    
    def get_queryset(self):
        client = get_request_client_or_raise(self.request)
        return favorites_products_qs(client)
    
class FavoriteAddView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        client = get_request_client_or_raise(request)
        slug = request.data.get('product')
        
        if not slug:
            return Response(
                {
                    "detail": "product slug required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            product = Product.objects.get(slug=slug, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {
                    "detial": "product not found",
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        favorites_add(client, product=product)
        return Response(
            status=status.HTTP_204_NO_CONTENT,
        )
        
class FavoriteRemoveView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, slug: str):
        client = get_request_client_or_raise(request)
        product = Product.objects.filter(slug=slug).first()
        if product:
            favorites_remove(client, product=product)
        return Response(status=status.HTTP_204_NO_CONTENT)