from datetime import timedelta
from pathlib import Path
import os, sys
from dotenv import load_dotenv


load_dotenv()


BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR.parent
sys.path.insert(0, os.path.join(BASE_DIR, 'apps'))
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


SECRET_KEY = os.environ["DJANGO_KEY"]

DEBUG = True

ALLOWED_HOSTS = []

LOCAL_APPS = [
    'apps.products.apps.ProductsConfig',
    'apps.customers.apps.CustomersConfig',
    'apps.orders.apps.OrdersConfig',
    'apps.payments.apps.PaymentsConfig',
]

DRF_APPS = [
    'rest_framework',
    'drf_yasg',
    'rest_framework_simplejwt',
]

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

INSTALLED_APPS = DJANGO_APPS + DRF_APPS + LOCAL_APPS

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
        'rest_framework.permissions.IsAuthenticated',
    ),
    'EXCEPTION_HANDLER': 'core.apps.customers.exceptions.custom_exception_handler',
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASS = os.getenv("REDIS_PASSWORD", "")
REDIS_TLS = os.getenv("REDIS_TLS", "0") == "1"
CACHE_KEY_PREFIX = os.getenv("CACHE_KEY_PREFIX", "shop")

RECENTLY_VIEWED = {
    "TTL_SECONDS": int(os.getenv("RECENTLY_VIEWED_TTL_SECONDS", str(60 * 60 * 24 * 30))),
    "MAX_LEN": int(os.getenv("RECENTLY_VIEWED_MAX_LEN", "50")),
    "ANON_HEADER": "X-Anon-Id",
}

_SCHEME = "rediss" if REDIS_TLS else "redis"

def _redis_url(db: int) -> str:
    if REDIS_PASS:
        return f"{_SCHEME}://:{REDIS_PASS}@{REDIS_HOST}:{REDIS_PORT}/{db}"
    return f"{_SCHEME}://{REDIS_HOST}:{REDIS_PORT}/{db}"

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": _redis_url(0),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "IGNORE_EXCEPTIONS": True,
        },
        "TIMEOUT": None,
        "KEY_PREFIX": CACHE_KEY_PREFIX,
    },
    "recently_viewed": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": _redis_url(1),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "IGNORE_EXCEPTIONS": True,
        },
        "TIMEOUT": None,
        "KEY_PREFIX": CACHE_KEY_PREFIX,
    },
    "cart": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": _redis_url(2),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "IGNORE_EXCEPTIONS": True,
        },
        "TIMEOUT": None,
        "KEY_PREFIX": CACHE_KEY_PREFIX,
    },
}


SWAGGER_SETTINGS = {
    'USE_SESSION_AUTH': False,
    'SECURITY_DEFINITIONS': {
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header',
            'description': 'Введи: Bearer <token>'
        }
    },
    'USE_SESSION_AUTH': False,
}


SIMPLE_JWT = {
    'AUTH_HEADER_TYPES': ('Bearer',),
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


LANGUAGE_CODE = 'ru-ru'

TIME_ZONE = 'Europe/Moscow'

USE_I18N = True

USE_TZ = True


STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / "STATIC",
]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# AUTH_USER_MODEL = 'apps.customers.Client'


# T-BANK
T_BANK_MODE = os.getenv("T_BANK_MODE", "demo").lower()

T_BANK = {
    "BASE_URL": "https://rest-api-test.tinkoff.ru/v2" if T_BANK_MODE == "demo" else "https://securepay.tinkoff.ru/v2",
    "TERMINAL_KEY": os.getenv("TINKOFF_TERMINAL_KEY_DEMO") if T_BANK_MODE == "demo" else os.getenv("TINKOFF_TERMINAL_KEY"),
    "PASSWORD": os.getenv("TINKOFF_PASSWORD_DEMO") if T_BANK_MODE == "demo" else os.getenv("TINKOFF_PASSWORD"),
    "SUCCESS_URL": os.getenv("PAY_SUCCESS_URL", "http://127.0.0.1:5173/pay/success"),
    "FAIL_URL":    os.getenv("PAY_FAIL_URL",    "http://127.0.0.1:5173/pay/fail"),
}
if not T_BANK["TERMINAL_KEY"] or not T_BANK["PASSWORD"]:
    raise RuntimeError(
        "T_BANK credentials are not set. Check .env"
    )

# TINKOFF_TERMINAL_KEY_DEMO = os.environ["TINKOFF_TERMINAL_KEY_DEMO"]
# TINKOFF_PASSWORD_DEMO = os.environ["TINKOFF_PASSWORD_DEMO"]

# банк редеректит пользователя
PAYMENTS_SUCCESS_URL = os.getenv("PAY_SUCCESS_URL", "http://127.0.0.1:5173/pay/success")
PAYMENTS_FAIL_URL    = os.getenv("PAY_FAIL_URL", "http://127.0.0.1:5173/pay/fail")