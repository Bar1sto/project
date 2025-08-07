from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from apps.customers.models import (
    Client,
)
from apps.customers.serializers import (
    ClientSerializer
)


class ClientApiView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        client = request.user.client
        serializer = ClientSerializer(client)
        return Response(serializer.data)
    
    
    
class CLientRegisterView(APIView):
    pass