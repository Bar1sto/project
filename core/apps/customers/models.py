from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import RegexValidator

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
    birthday = models.DateField(
        verbose_name='Дата рождения'
    )
    slug = models.SlugField(
        max_length=255,
        unique=True,
        blank=True,
        null=True,
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
        app_label = 'customers'
        verbose_name = 'Клиент'
        verbose_name_plural = 'Клиенты'
        ordering = ['-id']
        indexes = [
            models.Index(fields=['surname', 'name']),
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
        'orders.Cart',
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
    def create_from_order(cls, cart):
        if not cart.is_ordered or not cart.client:
            return None
        if not cart.total_sum or cart.total_sum <= 0:
            return None
        
        bonus_amount = cart.total_sum * Decimal('0.05')
        
        return cls.objects.create(
            client=cart.client,
            amount=bonus_amount,
            order=cart,
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
        verbose_name='Статус промокоода',
    )
    is_personal = models.BooleanField(
        default=False,
        verbose_name='Персональный промокод'
    )
    
    def __str__(self):
        return f'{self.name}'
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        if self.is_active and not self.is_personal:
            clients = Client.objects.all()
            
            for client in clients:
                PromocodeClient.objects.update_or_create(
                    client=client,
                    promocode=self,
                    defaults={'promocode': self}
                )
        elif not self.is_active:
            PromocodeClient.objects.filter(promocode=self).delete()
            
    
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
        verbose_name = 'Использрованный промокод'
        verbose_name_plural = 'Использованные промокоды'
        ordering = ['-used_at']