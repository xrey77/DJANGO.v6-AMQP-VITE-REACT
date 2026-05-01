from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    costprice = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=True)
    sellprice = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=True)
    saleprice = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=True)

    class Meta:
        model = Product
        fields = ('id','category','descriptions','qty','unit','costprice','sellprice','saleprice','productpicture','alertstocks','criticalstock',)
        # fields = '__all__'

