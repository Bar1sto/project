from django.urls import path, include
from apps.customers.views import (
    ClientApiView,
    ClientRegisterView,
    )


urlpatterns = [
    path('customers/', ClientApiView.as_view()),
    path('register/', ClientRegisterView.as_view(), name='register_client'),
]
