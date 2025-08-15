from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.customers.serializers import (
    ClientSerializer,
    ClientRegisterSerializer,
    ClientUpdateSerializer,
)


class ClientRetrieveUpdateView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_serializer_class(self):
        if self.request.method in ['PATCH', 'PUT']:
            return ClientUpdateSerializer
        return ClientSerializer
        
    def get_object(self):
        return self.request.user.client
    
    
class ClientRegisterView(CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = ClientRegisterSerializer


class ClientLogoutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def post(self, request):
        return Response(
            {
                "detail": "Вы вышли из системы"
            },
            status=status.HTTP_200_OK
        )
    