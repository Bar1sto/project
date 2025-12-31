from django.urls import path

from .views import (
    CartItemDeleteView,
    CartItemSetView,
    CartMergeView,
    CartRepeatView,
    CartRetrieveView,
    OrderDetailView,
    OrderHistoryView,
)

app_name = "orders"

urlpatterns = [
    path("", CartRetrieveView.as_view(), name="cart_retrieve"),
    path("items/", CartItemSetView.as_view(), name="cart_item_set"),
    path(
        "items/<int:variant_id>/", CartItemDeleteView.as_view(), name="cart_item_delete"
    ),
    path("merge/", CartMergeView.as_view(), name="cart_merge"),
    path("cart/repeat/<int:order_id>/", CartRepeatView.as_view(), name="cart_repeat"),
    path("history/", OrderHistoryView.as_view(), name="order_history"),
    path(
        "history/<int:order_id>/",
        OrderDetailView.as_view(),
        name="order_detail",
    ),
]
