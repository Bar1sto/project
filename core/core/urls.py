from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from core.swagger import schema_view
from apps.products.views import (
    FavoriteListView,
    FavoriteSetView,
    RecentlyViewedListView,
)


urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('api/clients/', include('apps.customers.urls')),
    
    path('api/products/', include('apps.products.urls')),
    
    path('api/orders/', include('apps.orders.urls')),
    
    path('favorites/', FavoriteListView.as_view(), name='favorites_list'),
    
    path('api/recently-viewed/', RecentlyViewedListView.as_view(), name='recently_viewed'),
    
    path('api/payments/', include('apps.payments.urls', namespace='payments')),
    
    path('favorites/<slug:slug>/', FavoriteSetView.as_view(), name='favorites_remove'),
    
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    
    # path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
