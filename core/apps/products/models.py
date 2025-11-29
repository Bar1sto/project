from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.urls import reverse


class Brand(models.Model):
    name = models.CharField(
        max_length=255,
        verbose_name="Название бренда",
        unique=True,
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Бренд"
        verbose_name_plural = "Бренды"
        ordering = ["name"]


class Category(models.Model):
    name = models.CharField(max_length=255, verbose_name="Название категории")
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="Родительская категория",
    )
    slug = models.SlugField(
        "URL-идентификатор",
        max_length=255,
        blank=True,
        db_index=True,
    )

    def __str__(self):
        if self.parent:
            return f"{self.parent} → {self.name}"
        return self.name

    class Meta:
        verbose_name = "Категория"
        verbose_name_plural = "Категории"
        ordering = ["name"]


class Product(models.Model):
    name = models.CharField(
        max_length=255,
        verbose_name="Название товара",
        db_index=True,
    )
    description = models.TextField(verbose_name="Описание товара", blank=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        verbose_name="Категория",
        related_name="products",
    )
    brand = models.ForeignKey(
        Brand,
        on_delete=models.PROTECT,
        verbose_name="Бренд",
        related_name="products",
    )
    is_sale = models.BooleanField(
        verbose_name="Распродажный товар",
        default=True,
        db_index=True,
    )
    is_new = models.BooleanField(
        verbose_name="Новый товар",
        default=True,
        db_index=True,
    )
    is_hit = models.BooleanField(
        default=False,
        verbose_name="Хит",
    )
    is_active = models.BooleanField(
        verbose_name="Отображать в каталоге",
        default=True,
        db_index=True,
    )
    slug = models.SlugField(
        verbose_name="URL-идентификатор",
        max_length=255,
        unique=True,
        blank=True,
    )
    image = models.ImageField(
        upload_to="productiproducts_image/",
        verbose_name="Изображение",
        blank=True,
        null=True,
    )
    sale = models.PositiveIntegerField(
        verbose_name="Скидка (%)",
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    price = models.DecimalField(
        verbose_name="Цена для отображения",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"{self.name}"

    def get_absolute_url(self):
        return reverse("product:product", kwargs={"slug": self.slug})

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Товар"
        verbose_name_plural = "Товары"
        ordering = ["-id"]
        indexes = [
            models.Index(fields=["name", "brand"]),
        ]


class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, verbose_name="Товар", related_name="variants"
    )
    size_type = models.CharField(max_length=50, verbose_name="Тип размера", blank=True)
    size_value = models.CharField(
        max_length=50, verbose_name="Значение размера", blank=True
    )
    color = models.CharField(max_length=50, verbose_name="Цвет", blank=True)
    base_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Базовая цена",
        default=0,
    )
    current_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Текущая цена",
        editable=False,
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="В наличии",
    )
    is_order = models.BooleanField(verbose_name="Под заказ", default=False)

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
        super().save(*args, **kwargs)

    @property
    def display_price(self):
        if self.current_price is None:
            return "Цена не указана"
        return f"{float(self.current_price):.2f}"

    class Meta:
        verbose_name = "Вариант товара"
        verbose_name_plural = "Варианты товаров"


class Favorite(models.Model):
    client = models.ForeignKey(
        "customers.Client",
        on_delete=models.CASCADE,
        related_name="favorites",
        verbose_name="Клиент",
        db_index=True,
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="favorited_by",
        verbose_name="Товар",
        db_index=True,
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        verbose_name = "Избранное"
        verbose_name_plural = "Избранные товары"
        constraints = [
            models.UniqueConstraint(
                fields=["client", "product"], name="uq_favorite_client_product"
            ),
        ]
        indexes = [
            models.Index(fields=["client", "created_at"]),
        ]

    def __str__(self):
        return f"{self.client_id} ♥ {self.product_id}"
