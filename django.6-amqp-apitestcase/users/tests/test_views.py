from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.test import APITestCase, APIClient

User = get_user_model()

class GetAllUsersTestCase(APITestCase):
    def setUp(self):
        self.url = reverse('get-allusers')
        self.User = get_user_model()
        self.test_user = self.User.objects.create_user(username='Roger', password='password123')
        self.other_user = self.User.objects.create_user(username='Steve', password='password123')

        # Generate Token
        refresh = RefreshToken.for_user(self.test_user)
        self.token = str(refresh.access_token)

    @patch('config.tasks.authenticate_user_task.apply_async')
    def test_get_all_users_success(self, mock_amqp_task):
        # 1. Authenticate the test client
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        # 2. Make the ACTUAL request to your API
        response = self.client.get(self.url)

        # 3. Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if AMQP task was triggered (assuming your VIEW calls this task)
        mock_amqp_task.assert_called_once_with(
            args=['guests', 'guests'],
            exchange='central_topic',
            routing_key='auth.getusers.success'
        )

    def test_get_all_users_unauthorized(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['message'], 'Unauthorized Access.')

@patch('config.tasks.authenticate_user_task.apply_async')
def test_get_all_users_no_records(self, mock_amqp_task):
    # 1. Authenticate (required to reach the view logic)
    self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    # 2. Clear all users except the one currently logged in
    # Use self.test_user instead of self.user
    self.User.objects.exclude(id=self.test_user.id).delete()

    # 3. Make the request
    response = self.client.get(self.url)

    # 4. Assertions
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    # Depending on your view logic, check for an empty list or specific message
    self.assertEqual(len(response.data), 0) 


class GetUserIdTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='Winnie', password='reynald@88')
        self.url = reverse('get-userid', kwargs={'id': self.user.id})

        refresh = RefreshToken.for_user(self.user)         
        self.token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')


    @patch('config.tasks.authenticate_user_task.apply_async')
    def test_get_user_success(self, mock_amqp_task):

        self.user = User.objects.create_user(username='Willie', password='reynald@88')
        self.url = reverse('get-userid', kwargs={'id': self.user.id})

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

#         # 2. Make the ACTUAL request to your API
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

        mock_amqp_task.assert_called_once_with(
            args=['guests', 'guests'],
            exchange='central_topic',
            routing_key='auth.getuserid.success'
        )

    def test_get_user_unauthorized_missing_header(self):
        self.client.force_authenticate(user=None)        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['message'], 'Unauthorized Access.')

    def test_get_user_invalid_token_format(self):
        self.client.force_authenticate(user=None)                
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['message'], 'Unauthorized Access.')

    def test_get_user_not_found(self):
        invalid_url = reverse('get-userid', kwargs={'id': 9999})        
        self.client.force_authenticate(user=self.user)
        response = self.client.get(invalid_url)                
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['message'], 'User not found.')


class DeleteUserTests(APITestCase):
    def setUp(self):
        # Create an admin user to handle permissions
        self.admin_user = User.objects.create_superuser(
            username='admin', password='password123', email='admin@test.com'
        )
        # Create a target user to delete
        self.target_user = User.objects.create_user(
            username='johndoe', password='password123'
        )
        # Assume your URL pattern is path('delete-user/<int:id>/', DeleteUserId.as_view(), name='delete-user')
        self.url = reverse('delete-user', kwargs={'id': self.target_user.id})
        
        # Authenticate the client
        self.client.force_authenticate(user=self.admin_user)

    @patch('config.tasks.authenticate_user_task.apply_async')
    def test_delete_user_success(self, mock_task):
        """Test successful deletion and AMQP task trigger"""
        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(User.objects.count(), 1)  # Only admin remains
        self.assertEqual(response.data['message'], 'User deleted successfully.')
        
        # Verify Celery task was called with correct routing
        mock_task.assert_called_once_with(
            args=['guests', 'guests'],
            exchange='central_topic',
            routing_key='auth.deleteuser.success'
        )

    def test_delete_user_not_found(self):
        """Test behavior when ID does not exist"""
        invalid_url = reverse('delete-user', kwargs={'id': 9999})
        response = self.client.delete(invalid_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['message'], 'User not found.')

    def test_delete_user_unauthorized(self):
        """Test that non-admin users cannot delete"""
        regular_user = User.objects.create_user(username='regular', password='password')
        self.client.force_authenticate(user=regular_user)
        
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)




class UpdateProfileTests(APITestCase):
    def setUp(self):        
        self.client = APIClient()
        self.user = User.objects.create_user(username='XWinnie', password='reynald@88')
        self.url = reverse('update-profile', kwargs={'id': self.user.id})
        refresh = RefreshToken.for_user(self.user)         
        self.token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')


    @patch('config.tasks.authenticate_user_task.apply_async')
    def test_update_profile_success(self, mock_amqp):
        data = {
            'first_name': 'Cindy',
            'last_name': 'Rothrock Jr',
            'mobile': '+6334367890'
        }

        response = self.client.patch(self.url, data, format='json')

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Cindy')
        
        # Verify AMQP Call
        mock_amqp.assert_called_once_with(
            args=['guests', 'guests'],
            exchange='central_topic',
            routing_key='auth.profilepupdate.success'
        )

    def test_update_profile_unauthorized(self):
        self.client.credentials()
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['message'], 'Unauthorized Access.')


class ChangePasswordTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='Bruce',password='reynald@88!')
        self.url = reverse('change-password', kwargs={'id': self.user.id})

        # Generate the actual token
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        
        # Set the header for all requests in this test class
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')


    @patch('config.tasks.authenticate_user_task.apply_async')
    def test_change_password_success(self, mock_amqp):
        data = {"password": "jigoro@88"}
        
        response = self.client.patch(self.url, data, format='json')

        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Your password has been successfully updated.')
        
        # Verify password actually changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("jigoro@88"))
        
#         # Verify AMQP Call
        mock_amqp.assert_called_once_with(
            args=['guests', 'guests'],
            exchange='central_topic',
            routing_key='auth.changepassword.success'
        )
        
    def test_change_password_no_auth(self):
        self.client.force_authenticate(user=None)                  
        data = {"password": "NewSecurePassword@123!"}
        response = self.client.patch(self.url, data, format='json')        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['message'], 'Unauthorized Access.')        

    def test_change_password_missing_password_field(self):
        data = {} 
        response = self.client.patch(self.url, data, format='json')        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Password is required.')

