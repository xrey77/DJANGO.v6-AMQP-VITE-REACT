from django.urls import path
from . import views

urlpatterns = [
    path('saleschart/', views.GetSales.as_view(), name="sales-chart"),
]