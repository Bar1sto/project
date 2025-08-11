from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from rest_framework.views import APIView
from apps.customers.models import (
    Client,
)
from apps.customers.serializers import (
    ClientSerializer,
    RegisterSerializer,   
)


class ClientApiView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        client = request.user.client
        serializer = ClientSerializer(client)
        return Response(serializer.data)
    
    def put(self, request):
        client = request.user.client
        serializer = ClientSerializer(
            client,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
    
class ClientRegisterView(generics.CreateAPIView):
    queryset = Client.objects.all()
    serializer_class = RegisterSerializer
    
    