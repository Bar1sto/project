from django.urls import path
from apps.customers.views import (
    ClientRetrieveUpdateView,
    ClientRegisterView,
    )

app_name = 'customers'

urlpatterns = [
    path('me/', ClientRetrieveUpdateView.as_view(), name='client_me'),
    path('register/', ClientRegisterView.as_view(), name='register_client'),
    
]
