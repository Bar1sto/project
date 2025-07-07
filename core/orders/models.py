from django.db import models
from django.utils.text import slugify
from django.urls import reverse
from customers.models import Client

class Cart(models.Model):
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE
    )
    create_at = models.DateField(
        verbose_name='Дата создания корзины',
    )
    update_at = models.DateField(
        verbose_name='Дата обновления корзины',
    )
    cart_total_sum = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Сумма корзины',
    )
    
    def __str__(self):
        return f'{self.pk}'
    
    
    class Meta:
        pass

class Order(models.Model):
    pass


