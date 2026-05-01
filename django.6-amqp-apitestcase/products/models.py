from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    category = models.ForeignKey(
        Category, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='products'
    )
    descriptions = models.TextField(max_length=255, unique=True)
    unit = models.CharField(max_length=50, blank=True, null=True) # Changed to CharField
    qty = models.IntegerField(default=0)
    costprice = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) 
    sellprice = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) 
    saleprice = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) 
    
    productpicture = models.ImageField(upload_to='products/', blank=True, null=True)
    
    alertstocks = models.IntegerField(default=0)
    criticalstocks = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.category} - {self.descriptions[:20]}"
