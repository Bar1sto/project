from django.db import models
from django.urls import reverse
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator


class ProductGroup(models.Model):
    name = models.CharField(
        max_length=255,
        verbose_name='Название группы товаров',
        unique=True
    )
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = 'Группа товаров'
        verbose_name_plural = 'Группы товаров'
        ordering = ['name']
    
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
    group = models.ForeignKey(
        ProductGroup,
        on_delete=models.PROTECT,
        verbose_name='Группа товаров',
        related_name='products',
    )
    is_active = models.BooleanField(
        verbose_name='Активен',
        default=True,
        db_index=True,
    )
    is_order = models.BooleanField(
        verbose_name='Под заказ',
        default=False
    )
    slug = models.SlugField(
        'URL-идентификатор',
        max_length=255,
        unique=True,
        blank=True
    )
    image = models.ImageField(
        upload_to='products/',
        verbose_name='Изображение',
        blank=True
    )
    sale = models.PositiveIntegerField(
        verbose_name='Скидка (%)',
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    def __str__(self):
        return f"{self.brand} {self.name}"
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
        
    def get_absolute_url(self):
        return reverse('product_detail', kwargs={'slug': self.slug})
    
    class Meta:
        verbose_name = 'Товар'
        verbose_name_plural = 'Товары'
        ordering = ['-name']
        indexes = [
            models.Index(fields=['name', 'brand']),
        ]
        
    
class ProductAttribute(models.Model):
    name = models.CharField(
        max_length=255,
        verbose_name='Название характеристики',
        unique=True
    )
    group = models.ForeignKey(
        ProductGroup,
        on_delete=models.CASCADE,
        verbose_name='Группа товаров'
    )
    
    def __str__(self):
        return f"{self.group} → {self.name}"
    
    class Meta:
        verbose_name = 'Характеристика товара'
        verbose_name_plural = 'Характеристики товаров'
        ordering = ['name']
    
class ProductAttributeValue(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        verbose_name='Товар'
    )
    attribute = models.ForeignKey(
        ProductAttribute,
        on_delete=models.CASCADE,
        verbose_name='Характеристика'
    )
    value = models.CharField(
        max_length=255,
        verbose_name='Значение'
    )
    
    def __str__(self):
        return f"{self.attribute}: {self.value}"
    
    class Meta:
        verbose_name = 'Значение характеристики'
        verbose_name_plural = 'Значения характеристик'
        unique_together = [['product', 'attribute']] 
    
class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        verbose_name='Товар'
    )
    size = models.CharField(
        max_length=50,
        verbose_name='Размер',
        blank=True
    )
    color = models.CharField(
        max_length=50,
        verbose_name='Цвет',
        blank=True
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Цена'
    )
    
    def __str__(self):
        variant_info = []
        if self.size:
            variant_info.append(f"Размер: {self.size}")
        if self.color:
            variant_info.append(f"Цвет: {self.color}")
        return f"{self.product} ({', '.join(variant_info)})"
    
    class Meta:
        verbose_name = 'Вариант товара'
        verbose_name_plural = 'Варианты товаров'
    
    
    
    
    
    