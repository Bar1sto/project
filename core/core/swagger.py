from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework_simplejwt.authentication import JWTAuthentication


schema_view = get_schema_view(
   openapi.Info(
      title="API Хоккейного магазина",
      default_version='v1',
      description="Первая попытка",
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
   authentication_classes=(JWTAuthentication,),
)

