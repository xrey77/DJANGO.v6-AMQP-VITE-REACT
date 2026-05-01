from django.urls import reverse
from unittest.mock import patch
from rest_framework import status
from rest_framework.test import APITestCase
from sales.models import Sale
from sales.serializers import SalesSerializer

class GetSalesTests(APITestCase):
    def setUp(self):
        self.url = reverse('sales-chart')
        self.sales = [
            Sale.objects.create(salesdate=f"Sale {i}") 
            for i in range(10)
        ]

    @patch('config.tasks.authenticate_user_task.apply_async')    
    def test_get_sales_success(self, mock_task):
        response = self.client.get(self.url)
        
        # Verify status and data
        sales = Sale.objects.all().order_by('id')
        serializer = SalesSerializer(sales, many=True)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)
        
        # Verify Celery task was called correctly
        mock_task.assert_called_once_with(
            args=['guests', 'guests'],
            exchange='central_topic',
            routing_key='auth.saleschart.success'
        )

    def test_get_sales_no_records(self):
        Sale.objects.all().delete()
        response = self.client.get(self.url)        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['message'], 'No record(s) found.')

