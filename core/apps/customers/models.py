import re
from django.db import models, transaction
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import date
from decimal import Decimal

        
class Client(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='client',
        null=True,
        blank=True,
        verbose_name='Пользователь'
    )
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
        blank=True,
    )
    phone_number = models.CharField(
        max_length=12,
        verbose_name='Номер телефона клиента',
        unique=True,
        
    )
    birthday = models.DateField(
        verbose_name='Дата рождения'
    )
    image = models.ImageField(
        upload_to='customer/',
        verbose_name='Изображение клиента',
        blank=True,
        null=True,
    )
    
    def __str__(self):
        return f'{self.surname} {self.name}'
    
    class Meta:
        app_label = 'customers'
        verbose_name = 'Клиент'
        verbose_name_plural = 'Клиенты'
        ordering = ['-id']
        indexes = [
            models.Index(fields=['surname', 'name']),
        ]
    
    def clean(self):
        digits = re.sub(
            r'\D',
            '', 
            self.phone_number
            )
        if digits.startswith('8'):
            digits = '7' + digits[1:]
        if not digits.startswith('7'):
            raise ValidationError(
                'Номер телефона должен начинаться с 7 или 8'
            )
        self.phone_number = '+' + digits
        
        if self.birthday > date.today():
            raise ValidationError(
                f'Дата рождения должна быть младше {date.today()}'
            )
        
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
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
        'orders.Cart',
        on_delete=models.CASCADE,
        related_name='bonuses',
        verbose_name='Заказ',
        blank=True,
        null=True,
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен'
    )
    
    def __str__(self):
        return f'{self.client}: {self.amount} (до {self.expires_at.date()})'
    
    @property
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    @classmethod
    def create_from_order(cls, cart):
        if not cart.is_ordered or cart.status != 'not_completed':
            return None
        if not cart.client or cart.total_sum <= 0:
            return None
    
        if cls.objects.filter(
            order=cart
        ).exists():
            return None
        
        bonus_amount = cart.total_sum * Decimal('0.05')
        
        try:
            with transaction.atomic():
                return cls.objects.create(
                    client=cart.client,
                    amount=bonus_amount,
                    order=cart,
                    expires_at=timezone.now() + timezone.timedelta(days=365)
                )
        
        except Exception as e:
            raise ValueError(f'Ошибка создания бонусов: {str(e)}')
        
        return None
    
    class Meta:
        verbose_name = 'Бонусы'
        verbose_name_plural = 'История бонусов'
        ordering = ['-expires_at']
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
        verbose_name='Статус промокоода',
    )
    is_personal = models.BooleanField(
        default=False,
        verbose_name='Персональный промокод'
    )
    amount = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Сумма скидки (в %)'
    )
    
    sale = models.DecimalField(
        decimal_places=2,
        max_digits=10,
        null=True,
        blank=True,
        verbose_name='Сумма скидки (в руб.)'
    )
    
    def __str__(self):
        return f'{self.name}'
    
    def clean(self):
        if self.amount and self.sale:
            raise ValidationError(
                'Укажите либо процентную скидку, либо фиксированную, но не обе сразу!'
            )
        if self.amount is not None and not (1 <= self.amount <= 100):
            raise ValidationError(
                'Процентная ставка должна быть в диапозоне от 1 до 100!'
            )
            
        
    class Meta:
        verbose_name = 'Промокод'
        verbose_name_plural = 'Промокоды'
        ordering = ['-id']
        
class PromocodeClient(models.Model):
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        verbose_name='Клиент',
        related_name='promocodes',
    )
    promocode = models.ForeignKey(
        Promocode,
        on_delete=models.CASCADE,
        verbose_name='Промокод',
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
        unique_together = [
            (
                'client',
                'promocode',
            )
        ]
        verbose_name = 'Использрованный промокод'
        verbose_name_plural = 'Использованные промокоды'
        ordering = ['-used_at']