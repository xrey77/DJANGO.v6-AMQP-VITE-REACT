import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django.6-amqp-apitestcase.settings')

app = Celery('django.6-amqp-apitestcase')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()
