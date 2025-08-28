from django.urls import path
from apps.products.views import (
    ProductRetrieveView,
    ProductListView,
)


app_name = 'product'

urlpatterns = [
    path('', ProductListView.as_view(), name='product_list'),
    
    path('<slug:slug>/', ProductRetrieveView.as_view(), name='product'),
]
