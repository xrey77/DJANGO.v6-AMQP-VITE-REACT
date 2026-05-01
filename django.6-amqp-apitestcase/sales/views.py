from rest_framework.views import APIView
from rest_framework.response import Response
from sales.models import Sale
from rest_framework import status
from .serializers import SalesSerializer
from config.tasks import authenticate_user_task 

class GetSales(APIView):    
    def get(self, request, *args, **kwargs):
        sales = Sale.objects.all()
        
        if not sales.exists():
            return Response(
                {"message": "No record(s) found."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SalesSerializer(sales, many=True)
        serialized_data = serializer.data

        # AMQP IMPLEMENTATION
        authenticate_user_task.apply_async(
            args=['guests', 'guests'],
            exchange='central_topic',
            routing_key='auth.saleschart.success'
        )

        return Response(serialized_data, status=status.HTTP_200_OK)
