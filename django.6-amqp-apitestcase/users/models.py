from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.files.storage import storages
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible

from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible

@deconstructible
class NoOpStorage(Storage):
    def _open(self, name, mode='rb'):
        return None

    def _save(self, name, content):
        # Return the name without actually saving the file
        return name

    def exists(self, name):
        return False

    def url(self, name):
        return ""


class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Users(AbstractUser):    
    mobile      = models.CharField(max_length=215, blank=True, null=True)
    userpic     = models.ImageField(upload_to='users/', blank=True, null=True)
    secret      = models.CharField(max_length=215, blank=True, null=True)
    qrcodeurl = models.TextField(null=True)
    # qrcodeurl   = models.ImageField(storage=NoOpStorage(), upload_to='qrcodes/', null=True, blank=True)    
    mailtoken   = models.IntegerField(default=0)    
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True) 

    role = models.ForeignKey(
        Role, 
        on_delete=models.SET_NULL,
        null=True,
        related_name='users'
    )
    
    # Inherited from AbstractUser:
    # username (already unique)
    # first_name (maps to your firstname)
    # last_name (maps to your lastname)
    # email
    # password (handled by AbstractUser)

    USERNAME_FIELD = 'username' 
    REQUIRED_FIELDS = ['email'] 