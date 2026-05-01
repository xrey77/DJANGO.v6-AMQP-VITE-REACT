from rest_framework.views import APIView
from django.contrib.auth import authenticate
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth.hashers import check_password, make_password
from rest_framework.response import Response
from rest_framework import status
from users.models import Users
from django.contrib.auth import get_user_model
from datetime import timedelta
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.password_validation import validate_password
from config.tasks import authenticate_user_task 

class UserLogin(APIView):
    
    def post(self, request, *args, **kwargs):
        req = request.data
        usrname = req.get('username')
        passwd  = req.get('password')
        try:
          djangoUser = Users.objects.get(username = usrname)           
          if djangoUser: 

            if not djangoUser.is_active:
                return Response({'message': 'Account is disabled.'}, status=status.HTTP_403_FORBIDDEN)

            if check_password(passwd, djangoUser.password): 

                user = authenticate(username=usrname, password=passwd)

                if user is not None:
                    
                    tokens = get_tokens_for_user(user)
                    
                    user_data = {
                        'message': 'Login Successful.',
                        'id': user.id,
                        'firstname': user.first_name,
                        'lastname': user.last_name,
                        'email': user.email,
                        'mobile': user.mobile,
                        'username': user.username,
                        'userpic': user.userpic.name if user.userpic else None,                  
                        'qrcodeurl': user.qrcodeurl or None,
                        'token': tokens['access']                        
                    }                    

                    # AMQP IMPLEMENTATION
                    authenticate_user_task.apply_async(
                        args=['guests', 'guests'],
                        exchange='central_topic',
                        routing_key='auth.login.success'
                    )

                    return Response(user_data, status=status.HTTP_200_OK)
                else:
                    return Response({'message': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)                    
            else:
                return Response({'message': 'Invalid Password, please try again.'}, status.HTTP_404_NOT_FOUND)
            
            
        except Users.DoesNotExist:
            return Response({'message': 'Username not found, please register.'}, status.HTTP_404_NOT_FOUND)

            
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    # access_token = refresh.access_token    
    return {
        'refresh': str(refresh),        
        'access': str(refresh.access_token),
    }                    
