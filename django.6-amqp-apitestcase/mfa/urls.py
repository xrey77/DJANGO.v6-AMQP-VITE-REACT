from django.urls import path
from . import views

urlpatterns = [
    path('mfa/activate/<int:id>/', views.MfaActivate.as_view(), name='mfaactivate'),
    path('mfa/verifytotp/<int:id>/', views.MfaVerification.as_view(), name='mfaverification'),
    path('mfa/getqrcode/<int:id>/', views.MfaQrcode.as_view(), name='getqrcode'),
]