from django.urls import path
from apps.products.views import (
    ProductRetrieveView,
    ProductListView,
)


urlpatterns = [
    path('<slug:>/', ProductRetrieveView.as_view(), name='product'),
    path('all/', ProductListView.as_view(), name='product_list'),
]
