from django.shortcuts import render
from rest_framework import generics
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


class ClientDetailAPIView(generics.RetrieveAPIView):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    
