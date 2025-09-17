from django.db import models


class Payment(models.Model):
    cart_id = models.PositiveIntegerField(
        db_index=True,
    )
    amount = models.PositiveIntegerField(
        
    )
    order_id = models.CharField(
        max_length=64,
        db_index=True,
    )
    payment_id = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        db_index=True,
    )
    status = models.CharField(
        max_length=32,
        default="NEW",
    )
    payment_url = models.URLField(
        blank=True,
        null=True,
    )
    raw_init_resp = models.JSONField(
        blank=True,
        null=True,
    )
    raw_last_callback = models.JSONField(
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        auto_now=True,
    )
    
    class Meta:
        indexes = [
            models.Index(
                fields=[
                    "cart_id",
                    "status",
                ]
            ),
        ]
    
    def __str__(self):
        return f'Payment №{self.pk} cart={self.cart_id} status={self.status}'