# users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'mobile', 'password']

    def validate_email(self, value):
        """
        Check if the email is already in use.
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value


    def validate_password(self, value):
        try:
            # This runs all validators defined in settings.py (MinimumLength, etc.)
            validate_password(value)
        except exceptions.ValidationError as e:
            # raise serializers.ValidationError(list(e.messages))
            raise serializers.ValidationError("\n".join(e.messages))
        return value

    def create(self, validated_data):
        # use create_user to handle password hashing automatically
        user = User.objects.create_user(**validated_data)
        return user
