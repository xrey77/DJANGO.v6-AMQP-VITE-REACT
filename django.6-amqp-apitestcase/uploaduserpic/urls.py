from django.urls import path
from . import views

urlpatterns = [
    path('uploadpicture/<int:id>/', views.UploadUserpic.as_view(), name='uploadpicture')
]