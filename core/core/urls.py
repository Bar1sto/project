from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('api/clients/', include('apps.customers.urls')),
    
    path('api/products/', include('apps.products.urls')),
    #   OpenAPI схема
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    #   Swagger UI
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='docs'),
    #   Redoc
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    #   JWT endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
