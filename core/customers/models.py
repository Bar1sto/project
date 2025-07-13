from django.db import models
from django.urls import reverse
from django.utils.text import slugify
from django.utils import timezone
from django.core.validators import RegexValidator, validate_email

from decimal import Decimal

        
class Client(models.Model):
    surname = models.CharField(
        max_length=255,
        verbose_name='Фамилия клиента',
    )
    name = models.CharField(
        max_length=255,
        verbose_name='Имя клиента',
    )
    patronymic = models.CharField(
        max_length=255,
        verbose_name='Отчество клиента',
        null=True,
    )
    phone_number = models.CharField(
        max_length=12,
        verbose_name='Номер телефона клиента',
        unique=True,
        validators=[RegexValidator(
            regex=r'^\+?\d{11}$',
            message='Номер телефона должен быть в формате 7991234567'
        )]
    )
    email = models.EmailField(
        unique=True,
        verbose_name='Почта клиента',
        validators=[validate_email],
    )
    birthday = models.DateField(
        verbose_name='Дата рождения'
    )
    slug = models.SlugField(
        max_length=255,
        unique=True,
        blank=True,
        verbose_name='Url-идентификатор',
    )
    image = models.ImageField(
        upload_to='clients/',
        verbose_name='Изображение клиента',
        blank=True
    )
    
    def __str__(self):
        return f'{self.surname} {self.name}'
    
    class Meta:
        verbose_name = 'Клиент'
        verbose_name_plural = 'Клиенты'
        ordering = ['-id']
        indexes = [
            models.Index(fields=['surname', 'name']),
            models.Index(fields=['email'])
        ]
        
@property
def total_bonus(self):
    active_bonuses = self.bonuses.filter(expires_at__gt=timezone.now())
    return active_bonuses.aggregate(total=models.Sum('amount'))['total'] or 0
        
        
class Bonus(models.Model):
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='bonuses',
        verbose_name='Клиент'
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Сумма бонусов',
        default=0,
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата начисления'
    )
        
    def default_expires_at():
        return timezone.now() + timezone.timedelta(days=365)
    
    expires_at = models.DateTimeField(
        verbose_name='Дата сгорания',
        default=default_expires_at,
    )
    order= models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='bonuses',
        verbose_name='Заказ',
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен'
    )
    
    def __str__(self):
        return f'{self.client}: {self.amount} (до {self.expires_at.date()})'
    
    @classmethod
    def create_from_order(cls, order):
        if not order.client:
            return None
        
        bonus_amount = order.order_total * Decimal('0.05')
        return cls.objects.create(
            client=order.client,
            amount=bonus_amount,
            order=order,
            expires_at=timezone.now() + timezone.timedelta(days=365)
        )
    
    class Meta:
        verbose_name = 'Бонусы'
        verbose_name_plural = 'История бонусов'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['expires_at', 'is_active']),
        ]
        

class Promocode(models.Model):
    name = models.CharField(
        max_length=255,
        verbose_name='Наименование промокода')
    last_day = models.DateField(
        verbose_name='Последняя дата активности')
    is_active = models.BooleanField(
        default=False,
        unique=True,
        verbose_name='Статус промокоода',
    )
    is_personal = models.BooleanField(
        default=False,
        unique=True,
        verbose_name='Персональный промокод'
    )
    
    def __str__(self):
        return f'{self.name}'
    
    class Meta:
        verbose_name = 'Промокод'
        verbose_name_plural = 'Промокоды'
        ordering = ['-id']
        
class PromocodeClient(models.Model):
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE
    )
    promocode = models.ForeignKey(
        Promocode,
        on_delete=models.CASCADE,
    )
    
    def __str__(self):
        return f'{self.client.id} {self.promocode.name}'
    
    class Meta:
        verbose_name = 'Промокод у клиента'
        verbose_name_plural = 'Промокоды у клиентов'
        ordering = ['-id']

class PromocodeUsage(models.Model):
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
    )
    promocode = models.ForeignKey(
        Promocode,
        on_delete=models.CASCADE,
    )
    used_at = models.DateField(
        verbose_name='Дата использования',
        null=True,
    )
    
    def __str__(self):
        return f'{self.client} {self.promocode}'
    
    class Meta:
        verbose_name = 'Использрованный промокод'
        verbose_name_plural = 'Использованные промокоды'
        ordering = ['-used_at']