import os
from pathlib import Path
from datetime import timedelta
from kombu import Exchange, Queue # type: ignore

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = 'django-insecure-@k7spc$nv18ik7n1kz@)$wcw)31-)7(915cgzcqr+hazj$jyu#'
DEBUG = True


SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8), # Set access token expiration to 15 minutes
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),  # Set refresh token expiration to 30 days
    # ... other settings (optional) ...
}

ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'corsheaders',
	'rest_framework',
    'rest_framework_simplejwt',
    'django_otp',
    'django_otp.plugins.otp_totp',    
    'django_filters',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'users',
    'login',
    'register',
    'sales',
    'mfa',
    'uploaduserpic',
    'home',
    'products'
]

AUTH_USER_MODEL = 'users.Users'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',    
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django_otp.middleware.OTPMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')], # Add this line        
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

REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'EXCEPTION_HANDLER': 'config.utils.exceptions.custom_exception_handler',  #custom auth message
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 5
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 10, # Custom minimum length
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
        # 'OPTIONS': {'password_list_path': '<path_to_your_file>'} # Optional: use a custom common password list
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]




WSGI_APPLICATION = 'config.wsgi.application'

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173", # Default Vite port
]

# AUTH_USER_MODEL = 'users.User' # Replace 'core' with your app name

# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'django5_vitevue',
        'USER': 'rey',
        'PASSWORD': 'rey',
        'HOST': '127.0.0.1',
        'PORT': '5432',
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

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


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'
STATICFILES_DIRS = [
    BASE_DIR / "static",
]

MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = '/media/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

#RABBITMQ SETTTINGS
central_topic_exchange = Exchange('central_topic', type='topic')
default_exchange = Exchange('default', type='direct')

CELERY_BROKER_URL = 'amqp://guest:guest@127.0.0.1:5672//'
CELERY_RESULT_BACKEND = 'rpc://'

# Enable auto-creation
CELERY_CREATE_MISSING_QUEUES = True

# Ensure exchange is defined correctly
CELERY_TASK_QUEUES = (
    Queue('default', default_exchange, routing_key='default'),
    # Use the variable defined above, NOT a string literal 'central_topic_exchange'
    Queue('auth_tasks', central_topic_exchange, routing_key='auth.#'),    
)

CELERY_TASK_DEFAULT_EXCHANGE = 'default'
CELERY_TASK_DEFAULT_ROUTING_KEY = 'default'
