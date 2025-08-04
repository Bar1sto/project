from django.db import models
from django.urls import reverse
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import F
from apps.orders.models import Cart, CartItem


class Brand(models.Model):
    name = models.CharField(
        max_length=255,
        verbose_name='Название бренда',
        unique=True,
    )
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = 'Бренд'
        verbose_name_plural = 'Бренды'
        ordering = ['name']

class Category(models.Model):
    name = models.CharField(
        max_length=255,
        verbose_name='Название категории'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name='Родительская категория'
    )
    
    # slug = models.SlugField(
    #     'URL-идентификатор',
    #     max_length=255,
    #     unique=True,
    #     blank=True
    # )
    
    def __str__(self):
        if self.parent:
            return f"{self.parent} → {self.name}"
        return self.name
    
    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['name']

class Product(models.Model):
    name = models.CharField(
        max_length=255,
        verbose_name='Название товара',
        db_index=True,
    )
    description = models.TextField(
        verbose_name='Описание товара',
        blank=True
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        verbose_name='Категория',
        related_name='products',
    )
    brand = models.ForeignKey(
        Brand,
        on_delete=models.PROTECT,
        verbose_name='Бренд',
        related_name='products',
    )
    is_sale = models.BooleanField(
        verbose_name='Распродажный товар',
        default=True,
        db_index=True,
    )
    is_new = models.BooleanField(
        verbose_name='Новый товар',
        default=True,
        db_index=True,
    )
    is_active = models.BooleanField(
        verbose_name='Отображать в каталоге',
        default=True,
        db_index=True,
    )
    slug = models.SlugField(
        'URL-идентификатор',
        max_length=255,
        # unique=True,
        blank=True
    )
    image = models.ImageField(
        upload_to='products_image/',
        verbose_name='Изображение',
        blank=True
    )
    sale = models.PositiveIntegerField(
        verbose_name='Скидка (%)',
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    def __str__(self):
        return f"{self.name}"
        
    def get_absolute_url(self):
        return reverse('product_detail', kwargs={'slug': self.slug})
    
    def save(self, *args, **kwargs):
        sale_changed = False
        if self.pk:
            old_sale = Product.objects.get(pk=self.pk).sale
            sale_changed = (old_sale != self.sale)
        
        super().save(*args, **kwargs)
        
        if sale_changed or not self.pk:
            self.update_variants_prices()
            self.update_related_carts()
        
        
    def update_variants_prices(self):
        self.variants.all().update(
            current_price=F('base_price') * (100 - self.sale) / 100
        )

    def update_related_carts(self):
        cart_ids = CartItem.objects.filter(
            product=self
        ).values_list('cart_id', flat=True).distinct()
        
        for cart_id in cart_ids:
            Cart.objects.get(pk=cart_id).update_total()
    
    class Meta:
        verbose_name = 'Товар'
        verbose_name_plural = 'Товары'
        ordering = ['-name']
        indexes = [
            models.Index(fields=['name', 'brand']),
        ]
        
class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        verbose_name='Товар',
        related_name='variants'
    )
    size_type = models.CharField(
        max_length=50,
        verbose_name='Тип размера',
        blank=True
    )
    size_value = models.CharField(
        max_length=50,
        verbose_name='Значение размера',
        blank=True
    )
    color = models.CharField(
        max_length=50,
        verbose_name='Цвет',
        blank=True
    )
    base_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Базовая цена',
        default=0,
    )
    current_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Текущая цена',
        editable=False,
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='В наличии',
    )
    is_order = models.BooleanField(
        verbose_name='Под заказ',
        default=False
    ) 
    def __str__(self):
        variant_info = []
        if self.size_type or self.size_value:
            variant_info.append(f"Размер: {self.size_type} {self.size_value}")
        if self.color:
            variant_info.append(f"Цвет: {self.color}")
        if self.current_price:
            variant_info.append(f"Цена: {self.current_price}")
        return f"{self.product} ({', '.join(variant_info)})"
    
    def save(self, *args, **kwargs):
       self.current_price = self.base_price * (100 - self.product.sale) / 100
       super().save(*args, **kwargs)
       
    @property
    def display_price(self):
        if self.current_price is None:
            return "Цена не указана"
        return f"{float(self.current_price):.2f}"
        
    class Meta:
        verbose_name = 'Вариант товара'
        verbose_name_plural = 'Варианты товаров'
    

    
    
    