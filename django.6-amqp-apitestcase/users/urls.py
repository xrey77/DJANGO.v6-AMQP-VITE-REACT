from django.urls import path
from . import views

urlpatterns = [
    path('getuserid/<int:id>/', views.GetUserId.as_view(), name='get-userid'),
    path('getallusers/', views.GetAllUsers.as_view(), name='get-allusers'),    
    path('deleteuser/<int:id>/', views.DeleteUserId.as_view(), name='delete-user'),
    path('updateprofile/<int:id>/', views.UpdateProfile.as_view(), name='update-profile'),
    path('changepassword/<int:id>/', views.ChangePassword.as_view(), name='change-password'),
]