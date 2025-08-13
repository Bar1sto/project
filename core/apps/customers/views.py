from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView
from apps.customers.serializers import (
    ClientSerializer,
    ClientRegisterSerializer,
    ClientUpdateSerializer,
)


class ClientRetrieveUpdateView(RetrieveUpdateAPIView):
    
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PATCH', 'PUT']:
            return ClientUpdateSerializer
        return ClientSerializer
        
    def get_object(self):
        return self.request.user.client
    
    
class ClientRegisterView(CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = ClientRegisterSerializer

    