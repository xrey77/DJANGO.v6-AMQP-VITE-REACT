# from django.contrib.auth.password_validation import MinimumLengthValidator, CommonPasswordValidator
import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password
from rest_framework import status
from users.serializers import UserSerializer
from .models import Users
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.db import IntegrityError
from django.contrib.auth.password_validation import validate_password
from config.tasks import authenticate_user_task 
from rest_framework import status, permissions

class GetAllUsers(APIView):    
    def get(self, request, *args, **kwargs):
        # 1. Extract and validate authentication header
        auth_header = request.headers.get('Authorization')        
        if auth_header:
            try:
                scheme, token = auth_header.split()                
            except ValueError:
                return Response({'message': 'Invalid Authorization'}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            return Response({'message': 'Unauthorized Access.'}, status=status.HTTP_401_UNAUTHORIZED)

        # 2. Fetch and serialize users
        User = get_user_model()
        query = Users.objects.all().order_by('id') 
        
        if query.count() <= 1:        
            return Response({'message': 'No record(s) found.'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = UserSerializer(query, many=True)
        serialized_data = serializer.data

        # AMQP IMPLEMENTATION
        authenticate_user_task.apply_async(
            args=['guests', 'guests'],
            exchange='central_topic',
            routing_key='auth.getusers.success'
        )

        return Response(serialized_data, status=status.HTTP_200_OK)
    
    
class GetUserId(APIView):    
    def get(self, request, *args, **kwargs):
        auth_header = request.headers.get('Authorization')        
        if auth_header:
            try:
                scheme, token = auth_header.split()                
            except ValueError:
                return Response({'message': 'Invalid Authorization'}, status.HTTP_401_UNAUTHORIZED)
        else:
            return Response({'message': 'Unauthorized Access.'}, status=401)
                
        idno = kwargs.get('id') 
        try:
            # 4. Fetch the user directly
            user = Users.objects.get(id=idno)
            
            jsonData = {                    
                'id': user.id,
                'firstname': user.first_name,
                'lastname': user.last_name,
                'email': user.email,
                'mobile': user.mobile,
                'qrcodeurl': user.qrcodeurl or None,
                'userpic': user.userpic.name if user.userpic else None
            }                

            # AMQP IMPLEMENTATION
            authenticate_user_task.apply_async(
                args=['guests', 'guests'],
                exchange='central_topic',
                routing_key='auth.getuserid.success'
            )


            return Response(jsonData, status.HTTP_200_OK) 
            
        except Users.DoesNotExist:
            return Response({'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


class DeleteUserId(APIView):
    # DRF handles the token/auth check automatically here
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def delete(self, request, *args, **kwargs):
        idno = kwargs.get('id')
        
        try:
            user = Users.objects.filter(id=idno).first()
            
            if not user:
                return Response({'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

            # Execution logic
            user.delete()

            # AMQP IMPLEMENTATION
            authenticate_user_task.apply_async(
                args=['guests', 'guests'],
                exchange='central_topic',
                routing_key='auth.deleteuser.success'
            )
            
            return Response({'message': 'User deleted successfully.'}, status=status.HTTP_200_OK)

        except IntegrityError as e:
            return Response({'message': f'Cannot delete user: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({'message': 'Unable to delete user.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            
class UpdateProfile(APIView):    
    def patch(self, request, *args, **kwargs):
        auth_header = request.headers.get('Authorization')        
        if auth_header:
            try:
                scheme, token = auth_header.split()                
            except ValueError:
                return Response({'message': 'Invalid Authorization'}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            return Response({'message': 'Unauthorized Access.'}, status=status.HTTP_401_UNAUTHORIZED)

        # idno = kwargs.get('id') 
        # user = Users.objects.get(id=idno)            
        # user = get_object_or_404(Users, id=kwargs.get('id'))            
        user = get_object_or_404(Users, id=kwargs.get('id'))            
        if user is not None:

            partial = request.method == 'PATCH'
            # serializer = UserSerializer(user, data=request.data, partial=partial)
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                    user = serializer.save()
                    user.first_name = request.data.get('first_name')
                    user.last_name = request.data.get('last_name');
                    user.mobile = request.data.get('mobile')
                    user.save()

                    # AMQP IMPLEMENTATION
                    authenticate_user_task.apply_async(
                        args=['guests', 'guests'],
                        exchange='central_topic',
                        routing_key='auth.profilepupdate.success'
                    )


                    return Response({'message': 'Your profile has been successfully updated.'}, status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'message': 'User not found.'}, status.HTTP_400_BAD_REQUEST)         

def check_special_characters(password):
    if not re.findall(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValidationError(
            _("The password must contain at least one special character."),
            code='password_no_symbol',
        )

class ChangePassword(APIView):
    def patch(self, request, *args, **kwargs):
        auth_header = request.headers.get('Authorization')        
        if auth_header:
            try:
                scheme, token = auth_header.split()                
            except ValueError:
                return Response({'message': 'Invalid Authorization'}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            return Response({'message': 'Unauthorized Access.'}, status=status.HTTP_401_UNAUTHORIZED)

        idno = kwargs.get('id')
        pwd = request.data.get("password")
        
        if not pwd:
            return Response({'message': 'Password is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Fetch the user (Replace 'Users' with your actual User model)
        user = get_object_or_404(Users, id=idno)

        try:
            # 2. Run standard Django validators (Min length, common, etc.)
            validate_password(pwd, user=user)            
            check_special_characters(pwd)            
            user.set_password(pwd)
            user.save()
            
            # AMQP IMPLEMENTATION
            authenticate_user_task.apply_async(
                args=['guests', 'guests'],
                exchange='central_topic',
                routing_key='auth.changepassword.success'
            )

            return Response({'message': 'Your password has been successfully updated.'}, status=status.HTTP_200_OK)

        except ValidationError as e:
            # Return the first error message found
            return Response({'message': list(e.messages)[0]}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
