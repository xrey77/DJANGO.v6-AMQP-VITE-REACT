from rest_framework import serializers
from drf_extra_fields.fields import Base64ImageField
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    userpic = serializers.ImageField(use_url=False)
        
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'mobile', 'username', 'userpic']
        