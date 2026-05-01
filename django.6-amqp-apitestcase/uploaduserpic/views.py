import os
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from users.serializers import UserSerializer
from users.models import Users
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404

class UploadUserpic(APIView):        
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request, *args, **kwargs):
      idno = kwargs.get('id')         
      image_file = request.data.get('userpic') 
      if image_file is not None:
        filename = image_file.name             
        ext = filename.split('.')[-1]
        newfilename = "00" + str(idno) + '.' + ext
            
        instance = get_object_or_404(Users, id=idno)                            
        partial = request.method == 'PATCH'        
        serializer = UserSerializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            uploaded_file = serializer.validated_data['userpic']  
            uploaded_file.name = newfilename                                        
            filepath = os.path.join('media/users/', newfilename)
            if os.path.isfile(filepath):
                try:
                    os.remove(filepath)
                except OSError:
                    print(None)

            try:
                serializer.save()      
            except Exception:
                    print(None)

            try:
                instance.refresh_from_db()
                Users.objects.filter(id=idno).update(userpic=newfilename)                
            except Exception:
                print(None)

            jsonData = {
                "userpic": newfilename
            }
            
            # kafka_service.produce_message(
            #     topic='user_getid', 
            #     key=str(idno), 
            #     value=jsonData
            # )

            return Response({
                'userpic': newfilename,
                'message': 'Your profile picture has been changed successfully.' }, status=status.HTTP_200_OK)
