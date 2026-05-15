from django.urls import path
from . import views

urlpatterns = [
    path('products/list/<int:page>/', views.ProductList.as_view(), name="product-list"),
    path('products/search/<int:page>/<str:key>/', views.ProductSearch.as_view(), name="product-search"),
    path('productreport/', views.ProductReport.as_view(), name='product-report'),
    path('productscategory/', views.ProductsCategoryReport.as_view(), name="products-category" ),
]
