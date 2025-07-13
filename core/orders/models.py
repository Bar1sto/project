from django.db import models
from django.utils.text import slugify
from django.urls import reverse
from products.models import Product, ProductVariant

class Cart(models.Model):
    client = models.ForeignKey(
        'customers.Client',
        on_delete=models.CASCADE
    )
    create_at = models.DateField(
        verbose_name='Дата создания корзины',
        auto_created=True
        
    )
    update_at = models.DateField(
        verbose_name='Дата обновления корзины',
        auto_created=True
        
    )
    cart_total_sum = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Сумма корзины',
    )
    
    def __str__(self):
        return f'{self.pk}'
    
    def calculate_total(self):
        total = sum(item.get_cost() for item in self.items.all())
        self.cart_total_sum = total
        self.save()
        return total
    
    class Meta:
        verbose_name = 'Корзина'
        verbose_name_plural = 'Корзины'
        ordering = ['-create_at']

class Order(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
    )
    client = models.ForeignKey(
        'customers.Client',
        on_delete=models.CASCADE,
    )
    order_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Сумма заказа'
    )
    create_at = models.DateField(
        verbose_name='Дата создания заказа',
        auto_created=True
    )
    
    CHOICES_STATUS = [
        ('completed', 'Выполнен'),
        ('not_completed', 'Невыполнен'),
    ]
    status = models.CharField(
        choices=CHOICES_STATUS,
        default='not_completed',
        verbose_name='Статус заказа',
    )
    shipping_address = models.TextField(
        verbose_name='Адрес доставки'
        )
    
    def __str__(self):
        return f'{self.pk}'
    
    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-status']
    
class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
    )
    product_variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
    )
    item_quantity = models.PositiveIntegerField(
        default=1,
        verbose_name='Количество товара в заказе',
    )
    
    def __str__(self):
        return f'{self.pk}'
    
    class Meta:
        verbose_name = 'Товар в заказе'
        verbose_name_plural = 'Товары в заказе'
        ordering = ['-pk']
        
class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
    )
    product_variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
    )
    quantity = models.PositiveIntegerField(
        default=1,
        verbose_name='Количество товаров в корзине',
    )
    
    def __str__(self):
        return f'{self.pk}'
    
    def get_cost(self):
        return self.product_variant.price * self.quantity
    
    class Meta:
        verbose_name = 'Товар в корзине'
        verbose_name_plural = 'Товары в корзине'
        ordering = ['-pk']