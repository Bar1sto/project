import traceback

from apps.customers.serializers import (
    ClientRegisterSerializer,
    ClientSerializer,
    ClientUpdateSerializer,
)
from rest_framework import status
from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication


class ClientRetrieveUpdateView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_serializer_class(self):
        if self.request.method in ["PATCH", "PUT"]:
            return ClientUpdateSerializer
        return ClientSerializer

    def get_object(self):
        return self.request.user.client


# class ClientRegisterView(CreateAPIView):
#     permission_classes = [AllowAny]
#     serializer_class = ClientRegisterSerializer


class ClientRegisterView(CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = ClientRegisterSerializer

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as exc:
            traceback.print_exc()
            return Response(
                {"detail": "Internal error while registering", "error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ClientLogoutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        return Response({"detail": "Вы вышли из системы"}, status=status.HTTP_200_OK)
