from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.customers.views import (
    ClientRetrieveUpdateView,
    ClientRegisterView,
    ClientLogoutView,
    )

app_name = 'customers'

urlpatterns = [
    path('me/', ClientRetrieveUpdateView.as_view(), name='client_me'),
    path('register/', ClientRegisterView.as_view(), name='client_register'),
    path('logout/', ClientLogoutView.as_view(), name='client_logout'),

     #   JWT endpoints
    path('login/', TokenObtainPairView.as_view(), name='client_login'),
    path('login/refresh/', TokenRefreshView.as_view(), name='client_login_refresh'),
    
    
]
