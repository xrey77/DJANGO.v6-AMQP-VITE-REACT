import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'your_project_name.settings')

app = Celery('your_project_name')

# Load configuration from Django settings, using the 'CELERY_' prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all registered Django apps.
# It looks for a 'tasks.py' module inside each app in INSTALLED_APPS.
app.autodiscover_tasks()
