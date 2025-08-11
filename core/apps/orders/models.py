from datetime import timezone
from decimal import Decimal
from django.db import models
from django.db.models import F, Sum
from apps.customers.services import BonusService


class Cart(models.Model):
    client = models.ForeignKey(
        'customers.Client',
        on_delete=models.CASCADE,
        verbose_name='Клиент',
        related_name='carts',
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
    is_ordered = models.BooleanField(
        verbose_name='Заказ',
        default=False,
        null=True,
    )
    ordered_at = models.DateField(
        verbose_name='Дата создания заказа',
        auto_created=True,
        null=True,
        blank=True,
    )
    CHOICES_STATUS = [
        ('draft', 'Черновик'),
        ('completed', 'Выполнен'),
        ('not_completed', 'Невыполнен'),
    ]
    status = models.CharField(
        choices=CHOICES_STATUS,
        default='draft',
        verbose_name='Статус заказа',
        null=True,
    )
    shipping_address = models.TextField(
        verbose_name='Адрес доставки',
        null=True,
        )
    
    def __str__(self):
        return f'Заказ №{self.pk}' if self.is_ordered else f'Корзина №{self.pk}'
    
    @property
    def total_sum(self):
       return sum(
           item.total_price for item in self.cart_items.all()
       )
    
    def calculate_total(self):
        total = Decimal('0.0')
        for item in self.cart_items.all():
            total += item.total_price()
        return total
    
    def update_total(self):
        result = self.cart_items.aggregate(
            total=Sum(F('product_variant__current_price') * F('quantity'))
        )
        self.cart_total_sum = result['total'] or 0
        self.save(update_fields=['cart_total_sum'])
    
    def save(self, *args, **kwargs):
        if self.pk:
            old_cart = Cart.objects.get(
                pk=self.pk
            )
            if old_cart.status == 'draft' and self.status == 'not_completed':
                self.is_ordered = True
                self.ordered_at = timezone.now()
                
                super().save(*args, **kwargs)
                self.create_bonuses()
                return
            super().save(*args, **kwargs)
            
        # if self.is_ordered and not self.pk:
        #     self.status = 'not_completed'
        # elif self.is_ordered:
        #     original = Cart.objects.get(pk=self.pk)
        #     if not original.is_ordered and self.is_ordered:
        #         self.status = 'not_completed'
                
        # super().save(*args, **kwargs)
        
    def create_bonuses(self):
        BonusService.create_from_order(self)
        
        
    class Meta:
        verbose_name = 'Корзина'
        verbose_name_plural = 'Корзины'
        ordering = ['-create_at']
        
        
class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        verbose_name='Корзина',
        related_name='cart_items',
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