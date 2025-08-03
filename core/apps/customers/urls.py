from django.urls import path, include
from apps.customers.views import (
    ClientViewSet,
    )
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'clients', ClientViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('id', include(router.urls)),
    
]
