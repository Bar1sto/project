from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    ValidationError,
    NotFound,
    PermissionDenied,
)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    
    if response is not None:
        return response
    
    if isinstance(exc, NotFound):
        return Response(
            {
                "detail": str(exc)
            },
            status=status.HTTP_404_NOT_FOUND
        )
    if isinstance(exc, ValidationError):
        return Response(
            {
                "detail": exc.detail
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    if isinstance(exc, PermissionDenied):
        return Response(
            {
                "detail": str(exc)
            },
            status=status.HTTP_403_FORBIDDEN
        )
        
    return Response(
        {
            "detail": "Внутренняя ошибка сервера"
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )