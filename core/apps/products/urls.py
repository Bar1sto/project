from django.urls import path
from apps.products.views import (
    ProductRetrieveView,
    ProductListView,
    FavoriteListView,
    FavoriteAddView,
    FavoriteRemoveView,
)


urlpatterns = [
    path('all/', ProductListView.as_view(), name='product_list'),
    path('<slug:slug>/', ProductRetrieveView.as_view(), name='product'),
    path('favorites/', FavoriteListView.as_view(), name='favorites_list'),
    path('favorites/add/', FavoriteAddView.as_view(), name='favorites_add'),
    path('favorites/<slug:slug>/', FavoriteRemoveView.as_view(), name='favorites_remove'),
    
    
]
