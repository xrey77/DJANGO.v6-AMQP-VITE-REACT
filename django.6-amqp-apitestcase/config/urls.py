from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('home.urls')),
    path('api/', include('register.urls')),
    path('api/', include('login.urls')),
    path('api/', include('users.urls')),   
    path('api/', include('mfa.urls')),
    path('api/', include('products.urls')),    
    path('api/', include('uploaduserpic.urls')),   
    path('api/', include('sales.urls')),         
]

# In browser: http://127.0.0.1:8000/media/users/001.jpeg
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
