from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import GenericAPIView
from rest_framework import mixins
from apps.customers.models import (
    Client,
)
from apps.customers.serializers import (
    ClientSerializer,
    ClientRegisterSerializer,
    ClientUpdateSerializer,
)


class ClientRetrieveView(
    mixins.RetrieveModelMixin,
    GenericAPIView
):
    permission_classes = [IsAuthenticated]
    serializer_class = ClientSerializer
    queryset = Client.objects.all()
    
    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)


class ClientUpdateView(
    mixins.UpdateModelMixin,
    GenericAPIView
):
    serializer_class = ClientUpdateSerializer

    def get_queryset(self):
        return Client.objects.filter(
            user=self.request.user
        )
    
    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)
    
    
class ClientRegisterView(mixins.CreateModelMixin, GenericAPIView):
    serializer_class = ClientRegisterSerializer
    queryset = Client.objects.all()
    
    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)
    

    