from rest_framework.views import exception_handler
from rest_framework.exceptions import NotAuthenticated
from rest_framework.response import Response

def custom_exception_handler(exc, context):
    # Call DRF's default exception handler first to get the standard response
    response = exception_handler(exc, context)

    # Check if the exception is due to missing authentication
    if isinstance(exc, NotAuthenticated):
        return Response({
            # "error": "Custom Error Message",
            "message": "Unauthorized Access.",
            # "status_code": 401
        }, status=401)

    return response
