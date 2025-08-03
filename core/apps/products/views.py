from django.shortcuts import render
from apps.products.serializers import (
    ProductSerializer,
)
from rest_framework import viewsets
from apps.products.models import(
    Product,
)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer