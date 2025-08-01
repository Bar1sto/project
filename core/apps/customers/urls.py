from django.urls import path
from apps.customers.views import ClientDetailAPIView


urlpatterns = [
    path('clients/<int:pk>/', ClientDetailAPIView.as_view(), name='client-detail')
    
]
