from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch

User = get_user_model()

class UserLoginTest(APITestCase):
    def setUp(self):
        self.url = reverse('user-login')  # Ensure this matches your urls.py name
        self.username = 'Chuck'
        self.password = 'reynald@88'
        self.user = User.objects.create_user(
            username=self.username, 
            password=self.password,
            first_name='Chuck',
            last_name='Norris'
        )

    @patch('config.tasks.authenticate_user_task.apply_async')
    def test_login_success(self, mock_amqp_task):
        data = {
            'username': self.username,
            'password': self.password
        }
        response = self.client.post(self.url, data, format='json')

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['username'], self.username)
        
        # Verify AMQP task was called with correct routing
        mock_amqp_task.assert_called_once_with(
            args=['guests', 'guests'],
            exchange='central_topic',
            routing_key='auth.login.success'
        )

    def test_login_invalid_password(self):
        data = {
            'username': self.username,
            'password': 'wrongpassword@88'
        }
        response = self.client.post(self.url, data, format='json')        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['message'], 'Invalid Password, please try again.')


    def test_login_inactive_user(self):
        self.user.is_active = False
        self.user.save()

        data = {
            'username': self.username,
            'password': self.password
        }
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['message'], 'Account is disabled.')
