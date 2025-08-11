from django.urls import path, include
from apps.customers.views import (
    ClientApiView,
    ClientRegisterView,
    )

app_name = 'customers'

urlpatterns = [
    path('me/', ClientApiView.as_view(), name='client_me'),
    path('register/', ClientRegisterView.as_view(), name='register_client'),
]
