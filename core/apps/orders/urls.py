from django.urls import path
from .views import (
    CartRetrieveView,
    CartItemSetView,
    CartItemDeleteView,
    CartMergeView,
    CartRepeatView,
)

app_name = "orders"

urlpatterns = [
    path("", CartRetrieveView.as_view(), name="cart_retrieve"),
    path("items/", CartItemSetView.as_view(), name="cart_item_set"),
    path("items/<int:variant_id>/", CartItemDeleteView.as_view(), name="cart_item_delete"),
    path("merge/", CartMergeView.as_view(), name="cart_merge"),
    path("cart/repeat/<int:order_id>/", CartRepeatView.as_view(), name="cart_repeat"),
]