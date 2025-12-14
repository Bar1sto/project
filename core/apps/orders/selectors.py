from apps.orders.models import (
    Cart,
    CartItem,
)


def get_or_create_draft_cart(client) -> Cart:
    """
    Возвращает текущую черновую корзину клиента.
    Если таких несколько — берём самую новую.
    Если ни одной нет — создаём.
    """
    qs = Cart.objects.filter(client=client, is_ordered=False).order_by("-id")

    cart = qs.first()
    if cart:
        return cart

    return Cart.objects.create(
        client=client,
        is_ordered=False,
        status="draft",
    )


def cart_items_qs(cart: Cart):
    return CartItem.objects.select_related(
        "product_variant",
        "product_variant__product",
        "product_variant__product__brand",
        "product_variant__product__category",
    ).filter(cart=cart)
