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



class ProductListView(ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductListSerializer
    
class ProductRetrieveView(RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field = 'slug'