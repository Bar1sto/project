from django.core.cache import cache
from django.db import models
from django.dispatch import receiver
from django.urls import reverse
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models.signals import post_save


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
    
    slug = models.SlugField(
        'URL-идентификатор',
        max_length=255,
        unique=True,
        blank=True
    )
    
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
        unique=True,
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
        if self.base_price:
            variant_info.append(f"Цена: {self.base_price}")
        return f"{self.product} ({', '.join(variant_info)})"
    
    @property
    def current_price(self):
        cache_key = f'variant_price_{self.id}'
        price = cache.get(cache_key)
        if price in None:
            price = self.base_price * (100 - self.product.sale) / 100
            cache.set(cache_key, price, timeout=60*60*24)
        return price    
    
    def clear_price_cache(self):
        cache.delete(f'variant_price_{self.id}')
        
    def save(self, *args, **kwargs):
        self.clear_price_cache()
        super().save(*args, **kwargs)
    
    @receiver(post_save, sender=Product)
    def update_prices_on_discount_change(sender, **kwargs):
        if 'sale' in kwargs.get('update_fields', []) or kwargs.get('created'):
            for variant in isinstance.variants.all():
                variant.clear_price_cache()
        
        
    
    
    class Meta:
        verbose_name = 'Вариант товара'
        verbose_name_plural = 'Варианты товаров'
    

    
    
    