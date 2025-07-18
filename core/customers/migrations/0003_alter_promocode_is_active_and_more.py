# Generated by Django 5.2.4 on 2025-07-17 15:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('customers', '0002_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='promocode',
            name='is_active',
            field=models.BooleanField(default=False, verbose_name='Статус промокоода'),
        ),
        migrations.AlterField(
            model_name='promocode',
            name='is_personal',
            field=models.BooleanField(default=False, verbose_name='Персональный промокод'),
        ),
    ]
