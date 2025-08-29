from django.apps import AppConfig


class OrdersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.orders'
    verbose_name = 'Заказы и корзина'

    def ready(self) -> None:
        from apps.orders import signals
        return super().ready()
    