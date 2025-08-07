from django.urls import path, include
from apps.customers.views import (
    ClientApiView,
    )


urlpatterns = [
    path('customers/', ClientApiView.as_view()),
]
