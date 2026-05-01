# login/tasks.py
from celery import shared_task
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

@shared_task
def authenticate_user_task(username, password):
    user = authenticate(username=username, password=password)
    if user is not None and user.is_active:
        refresh = RefreshToken.for_user(user)
        return {
            'status': 'success',
            'token': str(refresh.access_token),
            'username': user.username
        }
    return {'status': 'error', 'message': 'Invalid credentials'}

# authenticate_user_task.apply_async(
#     args=[username, password],
#     exchange='central_topic',
#     routing_key='auth.login.success'
# )
