from django.urls import path
from apps.orders.views import (
    CartRetrieveView,
    CartItemSetView,
    CartItemDeleteView,
    CartMergeView,
)


app_name = 'orders'

urlpatterns = [
    path("", CartRetrieveView.as_view(), name="cart_get"),
    path("items/", CartItemSetView.as_view(), name="cart_item_set"),
    path("items/<int:variant_id>/", CartItemDeleteView.as_view(), name="cart_item_delete"),
    path("merge/", CartMergeView.as_view(), name="cart_merge"),
]