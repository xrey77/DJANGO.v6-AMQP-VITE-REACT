from rest_framework import serializers
from .models import Sale

class SalesSerializer(serializers.ModelSerializer):
        
    class Meta:
        model = Sale
        fields = ['id', 'salesamount', 'salesdate']
        