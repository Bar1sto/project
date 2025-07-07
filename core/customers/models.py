from django.db import models
from django.urls import reverse
from django.utils.text import slugify


class Client(models.Modal):
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
        unique=True
    )
    birthday = models.DateField(
        verbose_name='Дата рождения'
    )
    bonus = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Сумма балов клииента'
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

class Promocode(models.Modal):
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

class PromocodeUsage(models.Modal):
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
        verbose_nnme = 'Использрованный промокод'
        verbose_name_plural = 'Использованные промокоды'
        ordering = ['-used_at']