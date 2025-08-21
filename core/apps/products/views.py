from rest_framework.generics import (
    ListAPIView,
    RetrieveAPIView,
)
from apps.products.serializers import (
    ProductSerializer,
    ProductListSerializer,
)
from rest_framework import viewsets
from apps.products.models import(
    Product,
)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    
class ProductRetrieveView(RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer    

class ProductListView(ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductListSerializer