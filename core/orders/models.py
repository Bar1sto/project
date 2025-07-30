from decimal import Decimal
from django.db import models
from django.dispatch import receiver
from django.db.models.signals import post_save, post_delete
from django.db.models import F, Sum

class Cart(models.Model):
    client = models.ForeignKey(
        'customers.Client',
        on_delete=models.CASCADE,
        verbose_name='Клиент',
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
        null=True,
        blank=True,
    )
    
    def __str__(self):
       return f'Корзина № {self.pk}'
   
    @property
    def total_sum(self):
       return sum(
           item.total_price for item in self.certitem_set.all()
       )
    
    def calculate_total(self):
        total = Decimal('0.0')
        for item in self.csrtitem_set.all():
            total += item.total_price()
        return total
    
    def update_total(self):
        from django.db.models import Sum, F
        result = self.cartitem_set.aggregate(
            total=Sum(F('product_variant__current_price') * F('quantity'))
        )
        self.cart_total_sum = result['total'] or 0
        self.save(update_fields=['cart_total_sum'])
        
        
    class Meta:
        verbose_name = 'Корзина'
        verbose_name_plural = 'Корзины'
        ordering = ['-create_at']
        
        
class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        verbose_name='Корзина'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        verbose_name='Товар'
    )
    product_variant = models.ForeignKey(
        'products.ProductVariant',
        on_delete=models.CASCADE,
        verbose_name='Вариант товара'
    )
    quantity = models.PositiveIntegerField(
        default=1,
        verbose_name='Количество товаров в корзине',
    )
    
    def __str__(self):
        return f'Количество: {self.quantity}'
    
    @property
    def total_price(self):
        return self.product_variant.current_price * self.quantity
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.cart.update_total()
    
    class Meta:
        verbose_name = 'Товар в корзине'
        verbose_name_plural = 'Товары в корзине'
        ordering = ['-pk']

class Order(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        verbose_name='Корзина'
    )
    client = models.ForeignKey(
        'customers.Client',
        on_delete=models.CASCADE,
        verbose_name='Клиент'
    )
    order_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Сумма заказа',
        blank=True,
        null=True,
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
        return f'Заказ №{self.pk}'
    
    def calculate_total(self):
        total = Decimal('0.0')
        for item in self.orderitem_set.all():
            total += item.total_price()
        return total
    
    def update_total(self):
        try:
            self.order_total = self.order_items.aggregate(
                total=Sum(F('product_variant__current_price') * F('item_quantity'))
            )['total'] or 0
            self.save(update_fields=['order_total'])
        except Exception as e:
            print(f"Ошибка при обновлении суммы заказа: {e}")
        
    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-status']
    
class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        verbose_name='Заказ',
        related_name='orderitem_set',
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        verbose_name='Товар'
    )
    product_variant = models.ForeignKey(
        'products.ProductVariant',
        on_delete=models.CASCADE,
        verbose_name='Вариант товара'
    )
    item_quantity = models.PositiveIntegerField(
        default=1,
        verbose_name='Количество товара в заказе',
    )
    
    def __str__(self):
        return f'Количетсво: {self.item_quantity}'
    
    def total_price(self):
        return self.product_variant.current_price * self.item_quantity
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.order.update_total()
        
    def delete(self, *args,**kwargs):
        order = self.order
        super().delete(*args, **kwargs)
        order.update_total()
        
    class Meta:
        verbose_name = 'Товар в заказе'
        verbose_name_plural = 'Товары в заказе'
        ordering = ['-pk']
        
@receiver(post_delete, sender=OrderItem)
def update_order_on_delete(sender, instance, **kwargs):
    order = isinstance.order
    order.order_total = order.calculate_total()
    order.save()
    