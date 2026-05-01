from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch
from products.models import Product

class ProductListTests(APITestCase):
    def setUp(self):
        # Create sample products
        self.products = [
            Product.objects.create(descriptions=f"Product {i}") 
            for i in range(10)
        ]
        self.url = lambda page: reverse('product-list', kwargs={'page': page})

    @patch('config.tasks.authenticate_user_task.apply_async')
    def test_get_product_list_success(self, mock_task):
        response = self.client.get(self.url(page=1))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['products']), 5)
        self.assertEqual(response.data['totalrecords'], 10)

        # Verify Celery task was called correctly
        mock_task.assert_called_once_with(
            args=['guests', 'guests'],
            exchange='central_topic',
            routing_key='auth.productlist.success'
        )


    def test_get_product_list_empty(self):
        Product.objects.all().delete()
        response = self.client.get(self.url(page=1))
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'No record(s) found.')

    @patch('config.tasks.authenticate_user_task.apply_async')
    def test_pagination_logic(self, mock_task):
        response = self.client.get(self.url(page=2))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['page'], 2)
        self.assertEqual(response.data['products'][0]['id'], self.products[5].id)


class ProductSearchTests(APITestCase):
    def setUp(self):
        # Create sample data
        Product.objects.create(descriptions="Gaming Laptop", sellprice=1000)
        Product.objects.create(descriptions="Office Mouse", sellprice=20)
        Product.objects.create(descriptions="Mechanical Keyboard", sellprice=100)

    @patch('config.tasks.authenticate_user_task.apply_async')
    def test_product_search_success(self, mock_task):
        url = reverse('product-search', kwargs={'page': 1, 'key': 'Laptop'})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['products']), 1)
        self.assertEqual(response.data['products'][0]['descriptions'], "Gaming Laptop")

        # Verify Celery task was called correctly
        mock_task.assert_called_once_with(
            args=['guests', 'guests'],
            exchange='central_topic',
            routing_key='auth.productsearch.success'
        )

    def test_product_search_no_results(self):
        url = reverse('product-search', kwargs={'page': 1, 'key': 'NonExistent'})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'No record(s) found.')
