from django.shortcuts import render
from rest_framework import generics, viewsets
from apps.customers.models import (
    Client,
    Bonus,
    Promocode,
    PromocodeClient,
    PromocodeUsage,
)
from apps.customers.serializers import (
    ClientSerializer
)


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    