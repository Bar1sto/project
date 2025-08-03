from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.products.views import (
    ProductViewSet,
)

router = DefaultRouter()
router.register(r'/api', ProductViewSet)

urlpatterns = [
    path('products', include(router.urls)),
    # path('id', include(router.urls)),
]
