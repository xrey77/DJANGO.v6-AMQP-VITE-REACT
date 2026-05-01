# users/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserRegistrationSerializer # type: ignore
from config.tasks import authenticate_user_task 

class UserRegistration(APIView):
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            xuser = serializer.save()
            xuser.role_id = 2
            xuser.userpic = 'users/pix.png'
            # xuser.isactive = True
            # xuser.is_superuser = True
            xuser.is_staff = True

            # AMQP IMPLEMENTATION
            authenticate_user_task.apply_async(
                args=['guests', 'guests'],
                exchange='central_topic',
                routing_key='auth.registration.success'
            )

            xuser.save()

            return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)