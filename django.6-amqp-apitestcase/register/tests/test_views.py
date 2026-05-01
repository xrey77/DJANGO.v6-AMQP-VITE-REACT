import pytest
from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

from users.models import Role

User = get_user_model()

class UserRegistrationTest(APITestCase):
    def setUp(self):
        self.url = reverse('user-registration')
        self.role = Role.objects.create(id=2, name='ROLE_USER')         
        self.valid_payload = {
            'username': 'Noel',
            'email': 'noel@chan.com',
            'password': 'reynaldd123'
        }

    @patch('config.tasks.authenticate_user_task.apply_async')
    def test_user_registration_success(self, mock_amqp_task):
        data = {
            "username": "Noel",
            "email": "noel@chan.com",
            "password": "reynald@123",
            "role": 2 
        }        
        response = self.client.post(self.url, self.valid_payload, format='json')

        # 1. Assert Response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'User created successfully')

        # 2. Assert Database state
        user = User.objects.get(username='Noel')
        self.assertEqual(user.email, 'noel@chan.com')
        self.assertEqual(user.role_id, 2)
        self.assertTrue(user.is_staff)

        # 3. Assert AMQP Integration (The Mock)
        # This ensures your view tried to send the message to the broker
        mock_amqp_task.assert_called_once_with(
            args=['guests', 'guests'],
            exchange='central_topic',
            routing_key='auth.registration.success'
        )

    def test_registration_invalid_data(self):
        invalid_payload = {'username': '', 'email': 'noel@yahoo.com'}
        response = self.client.post(self.url, invalid_payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Ensure no user was created
        self.assertEqual(User.objects.count(), 0)
