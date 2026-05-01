from decimal import Decimal
from django.db import models

class Sale(models.Model):
    salesamount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal("0.00")
    ) 
    salesdate = models.DateTimeField(auto_now_add=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Sale {self.id} - {self.salesamount}"
