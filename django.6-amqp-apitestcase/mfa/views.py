from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.models import Users
import pyotp
import qrcode
import base64
from io import BytesIO
from config.tasks import authenticate_user_task 

class MfaActivate(APIView):    
    def patch(self, request, *args, **kwargs):
        is_enabled_request = request.data.get('TwoFactorEnabled')
        user_id = kwargs.get('id') 
        
        user = Users.objects.filter(id=user_id).first() 
        if not user:
            return Response({'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if is_enabled_request:                 
            secret_key = pyotp.random_base32()             
            totp = pyotp.TOTP(secret_key)
            qrcode_uri = totp.provisioning_uri(name=user.email, issuer_name='SUPERCARS INC.')
            qrcode_base64 = generate_qr_code_base64(qrcode_uri)            
            user.secret = secret_key
            user.qrcodeurl = qrcode_base64
            user.save()      

            # AMQP IMPLEMENTATION
            authenticate_user_task.apply_async(
                args=['guests', 'guests'],
                exchange='central_topic',
                routing_key='auth.activatemfa.success'
            )

            return Response({
                'qrcodeurl': qrcode_base64,
                'message': 'Multi-Factor Authenticator is enabled.'
            }, status=status.HTTP_200_OK)
            
        else:            
            user.secret = None
            user.qrcodeurl = None
            user.save()
            return Response({
                'message': 'Multi-Factor Authenticator is disabled.'
            }, status=status.HTTP_200_OK)

        
class MfaQrcode(APIView):
    def get(self, request, *args, **kwargs):
        idno = kwargs.get('id')
        user = Users.objects.filter(id=idno).first()
        if user:            
            secret_key = user.secret
            totp = pyotp.TOTP(secret_key)        
            qrcodeuri = totp.provisioning_uri(name=user.email, issuer_name='SUPERCARS INC.')
            qrcode_base64 = generate_qr_code_base64(qrcodeuri)                
            
            # AMQP IMPLEMENTATION
            authenticate_user_task.apply_async(
                args=['guests', 'guests'],
                exchange='central_topic',
                routing_key='auth.mfaqrcode.success'
            )

            return Response({'qrcodeurl': qrcode_base64}, status=status.HTTP_201_CREATED)
    
    
        
class MfaVerification(APIView):    
    def patch(self, request, *args, **kwargs):
        idno = kwargs.get('id') 
        otp = request.data.get('otp')        
        user = Users.objects.get(id=idno)
        secret = user.secret
        totp = pyotp.TOTP(secret)                
        isValid = totp.verify(otp)        
        if isValid:

            # AMQP IMPLEMENTATION
            authenticate_user_task.apply_async(
                args=['guests', 'guests'],
                exchange='central_topic',
                routing_key='auth.mfaverfication.success'
            )

            return Response({
                'username': user.username,
                'message': 'Successfull OTP code verification.'}, status=status.HTTP_200_OK)
        else:                
            return Response({'message': 'Invalid OTP code.'}, status=status.HTTP_400_BAD_REQUEST)
        
        
def generate_qr_code_base64(data):
    qr_img = qrcode.make(data)
    # Save the image to a BytesIO buffer
    buffer = BytesIO()
    qr_img.save(buffer, format="PNG")
    buffer.seek(0)
    
    # Encode the image bytes to base64
    encoded_img = base64.b64encode(buffer.read()).decode()
    
    # Format for direct display in an HTML img tag or a frontend app
    qr_code_data = f'data:image/png;base64,{encoded_img}'
    
    return qr_code_data