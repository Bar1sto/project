from apps.products.models import (
    Category,
    Product,
)
from apps.products.selectors import (
    get_product_detail_qs,
    get_products_list_qs,
)
from apps.products.serializers import (
    ProductListSerializer,
    ProductSerializer,
)
from apps.products.services import (
    add_recent_view,
    favorites_add,
    favorites_products_qs,
    favorites_remove,
    get_recent_ids,
    get_request_client_or_raise,
    products_preserve_order,
)
from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils.text import slugify
from rest_framework import status
from rest_framework.authentication import (
    SessionAuthentication,
)
from rest_framework.generics import (
    ListAPIView,
    RetrieveAPIView,
)
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import (
    JWTAuthentication,
)


class ProductListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer

    def get_queryset(self):
        qs = get_products_list_qs(user=self.request.user)
        qs = qs.order_by("-id")
        qp = self.request.query_params

        def truthy(v):
            return str(v).lower() in ("1", "true", "yes", "y", "on")

        # ----- ПАРАМЕТРЫ -----
        cat = (qp.get("category") or "").strip()
        group = (qp.get("group") or qp.get("parent") or "").strip()

        # ----- ФИЛЬТР ПО КАТЕГОРИЯМ -----
        # грубый стеммер для русского: срезаем финальные гласные/мягкий знак
        def russian_stem(s: str) -> str:
            s = (s or "").strip().lower()
            while s and s[-1] in "аиыоуэеёюяйь":
                s = s[:-1]
            return s

        def make_name_q(name: str):
            """
            Строим Q для Category.name:
            - точное совпадение (iexact)
            - подстрока (icontains)
            - startswith по стемму, чтобы "Клюшки" поймало "Клюшка" и наоборот
            """
            if not name:
                return None
            name_l = name.lower()
            stem = russian_stem(name)

            q = Q(name__iexact=name) | Q(name__icontains=name)
            if stem and stem != name_l:
                q |= Q(name__istartswith=stem)
            return q

        cat_q = make_name_q(cat)
        grp_q = make_name_q(group)

        if cat_q or grp_q:
            # найдём набор категорий, по которым будем фильтровать товары
            cats = Category.objects.none()

            if cat_q and grp_q:
                # сначала ищем детей выбранного родителя
                parents = Category.objects.filter(grp_q)
                cats = Category.objects.filter(cat_q, parent__in=parents)

                # если по parent+child ничего не нашли — fallback:
                # плоская категория, в имени которой встречаются и group, и category
                if not cats.exists():
                    cats = Category.objects.filter(
                        Q(name__icontains=cat) & Q(name__icontains=group)
                    )

            elif cat_q:
                # только конкретная категория
                cats = Category.objects.filter(cat_q)

            elif grp_q:
                # только группа: берём сам родитель и всех его детей
                parents = Category.objects.filter(grp_q)
                cats = Category.objects.filter(
                    Q(id__in=parents) | Q(parent__in=parents)
                )

            qs = qs.filter(category__in=cats).distinct()

        # ----- ФИЛЬТР ПО РАЗМЕРАМ -----
        sizes = qp.get("sizes")
        if sizes:
            size_list = [s.strip() for s in sizes.split(",") if s.strip()]
            if size_list:
                qs = qs.filter(
                    variants__is_active=True,
                    variants__size_value__in=size_list,
                ).distinct()

        # ----- ХИТ / NEW / SALE -----
        if truthy(qp.get("popular")) or truthy(qp.get("is_hit")):
            qs = qs.filter(is_hit=True)

        if truthy(qp.get("is_new")):
            qs = qs.filter(is_new=True)

        if truthy(qp.get("is_sale")):
            qs = qs.filter(is_sale=True)

        # ----- LIMIT -----
        limit_raw = qp.get("limit")
        if limit_raw:
            try:
                limit = int(limit_raw)
                if limit > 0:
                    qs = qs[:limit]
            except (TypeError, ValueError):
                pass

        return qs


class ProductRetrieveView(RetrieveAPIView):
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [AllowAny]
    serializer_class = ProductSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return get_product_detail_qs(user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        user_id = request.user.id if request.user.is_authenticated else None
        annon_id = (
            None
            if user_id
            else request.headers.get(settings.RECENTLY_VIEWED["ANON_HEADER"])
        )
        add_recent_view(product_id=instance.id, user_id=user_id, annon_id=annon_id)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class FavoriteListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = ProductListSerializer

    def get_queryset(self):
        client = get_request_client_or_raise(self.request)
        return favorites_products_qs(client)


class FavoriteSetView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def put(self, request, slug):
        client = get_request_client_or_raise(request)
        product = Product.objects.filter(slug=slug, is_active=True).first()
        if not product:
            return Response(
                {"detail": "product not found"}, status=status.HTTP_404_NOT_FOUND
            )
        favorites_add(client, product=product)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, slug):
        client = get_request_client_or_raise(request)
        product = Product.objects.filter(slug=slug).first()
        if product:
            favorites_remove(client, product=product)
        return Response(status=status.HTTP_204_NO_CONTENT)


class RecentlyViewedListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        request = self.request
        try:
            limit = int(request.query_params.get("limit", 10))
        except ValueError:
            limit = 10

        if request.user.is_authenticated:
            user_id = request.user.id
            annon_id = None
        else:
            user_id = None
            annon_id = request.headers.get(settings.RECENTLY_VIEWED["ANON_HEADER"])

        ids = get_recent_ids(user_id=user_id, annon_id=annon_id, limit=limit)
        return products_preserve_order(ids)
