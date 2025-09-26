"""
Custom Exception Classes and Error Handling
Comprehensive error handling with structured responses
"""

from typing import Any, Dict, Optional
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse


class EllieException(Exception):
    """Base exception class for Ellie application"""
    
    def __init__(
        self,
        message: str,
        code: str = "ELLIE_ERROR",
        details: Optional[Dict[str, Any]] = None,
        status_code: int = 500
    ):
        self.message = message
        self.code = code
        self.details = details or {}
        self.status_code = status_code
        super().__init__(self.message)


class VoiceProcessingError(EllieException):
    """Voice processing related errors"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="VOICE_PROCESSING_ERROR",
            details=details,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
        )


class AIServiceError(EllieException):
    """AI service related errors"""
    
    def __init__(self, message: str, service: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="AI_SERVICE_ERROR",
            details={**(details or {}), "service": service},
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )


class RateLimitExceededError(EllieException):
    """Rate limiting errors"""
    
    def __init__(self, message: str = "Rate limit exceeded", retry_after: Optional[int] = None):
        super().__init__(
            message=message,
            code="RATE_LIMIT_EXCEEDED",
            details={"retry_after": retry_after} if retry_after else {},
            status_code=status.HTTP_429_TOO_MANY_REQUESTS
        )


class ServiceUnavailableError(EllieException):
    """Service unavailable errors"""
    
    def __init__(self, service: str, message: Optional[str] = None):
        super().__init__(
            message=message or f"Service {service} is currently unavailable",
            code="SERVICE_UNAVAILABLE",
            details={"service": service},
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )


class ValidationError(EllieException):
    """Input validation errors"""
    
    def __init__(self, message: str, field: Optional[str] = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            details={"field": field} if field else {},
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
        )


class AuthenticationError(EllieException):
    """Authentication related errors"""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            code="AUTHENTICATION_ERROR",
            details={},
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class AuthorizationError(EllieException):
    """Authorization related errors"""
    
    def __init__(self, message: str = "Access denied"):
        super().__init__(
            message=message,
            code="AUTHORIZATION_ERROR",
            details={},
            status_code=status.HTTP_403_FORBIDDEN
        )


class CircuitBreakerOpenError(EllieException):
    """Circuit breaker open errors"""
    
    def __init__(self, service: str):
        super().__init__(
            message=f"Circuit breaker is open for service: {service}",
            code="CIRCUIT_BREAKER_OPEN",
            details={"service": service},
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )


class CacheError(EllieException):
    """Cache related errors"""
    
    def __init__(self, message: str, operation: str):
        super().__init__(
            message=message,
            code="CACHE_ERROR",
            details={"operation": operation},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class ConfigurationError(EllieException):
    """Configuration related errors"""
    
    def __init__(self, message: str, config_key: Optional[str] = None):
        super().__init__(
            message=message,
            code="CONFIGURATION_ERROR",
            details={"config_key": config_key} if config_key else {},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class ExternalServiceError(EllieException):
    """External service integration errors"""
    
    def __init__(self, service: str, message: str, status_code: Optional[int] = None):
        super().__init__(
            message=f"External service error ({service}): {message}",
            code="EXTERNAL_SERVICE_ERROR",
            details={"service": service, "external_status_code": status_code},
            status_code=status.HTTP_502_BAD_GATEWAY
        )


class WebSocketError(EllieException):
    """WebSocket related errors"""
    
    def __init__(self, message: str, connection_id: Optional[str] = None):
        super().__init__(
            message=message,
            code="WEBSOCKET_ERROR",
            details={"connection_id": connection_id} if connection_id else {},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class ErrorHandler:
    """Centralized error handling utilities"""
    
    @staticmethod
    def create_error_response(
        error: EllieException,
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create standardized error response"""
        return {
            "error": {
                "code": error.code,
                "message": error.message,
                "details": error.details,
                "timestamp": "2024-12-19T10:30:00Z",  # Will be replaced with actual timestamp
                "request_id": request_id,
                "status_code": error.status_code
            }
        }
    
    @staticmethod
    def format_validation_error(exc: Exception) -> Dict[str, Any]:
        """Format Pydantic validation errors"""
        if hasattr(exc, 'errors'):
            errors = []
            for error in exc.errors():
                errors.append({
                    "field": ".".join(str(loc) for loc in error.get("loc", [])),
                    "message": error.get("msg", "Validation error"),
                    "type": error.get("type", "validation_error")
                })
            
            return {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Input validation failed",
                    "details": {"validation_errors": errors},
                    "timestamp": "2024-12-19T10:30:00Z",
                    "status_code": 422
                }
            }
        
        return {
            "error": {
                "code": "VALIDATION_ERROR",
                "message": str(exc),
                "details": {},
                "timestamp": "2024-12-19T10:30:00Z",
                "status_code": 422
            }
        }
    
    @staticmethod
    def get_user_friendly_message(error_code: str) -> str:
        """Get user-friendly error messages"""
        messages = {
            "VOICE_PROCESSING_ERROR": "We're having trouble processing your voice input. Please try again.",
            "AI_SERVICE_ERROR": "Our AI assistant is temporarily unavailable. Please try again in a moment.",
            "RATE_LIMIT_EXCEEDED": "You're sending requests too quickly. Please wait a moment and try again.",
            "SERVICE_UNAVAILABLE": "This service is temporarily unavailable. Please try again later.",
            "VALIDATION_ERROR": "The information you provided is not valid. Please check and try again.",
            "AUTHENTICATION_ERROR": "Please log in to access this feature.",
            "AUTHORIZATION_ERROR": "You don't have permission to access this resource.",
            "CIRCUIT_BREAKER_OPEN": "This service is temporarily unavailable due to high error rates.",
            "EXTERNAL_SERVICE_ERROR": "We're experiencing issues with an external service. Please try again later.",
            "WEBSOCKET_ERROR": "Connection error occurred. Please refresh and try again."
        }
        
        return messages.get(error_code, "An unexpected error occurred. Please try again.")


# Exception handlers for FastAPI
async def ellie_exception_handler(request: Request, exc: EllieException) -> JSONResponse:
    """Handle custom Ellie exceptions"""
    from app.core.logging import logger
    
    request_id = getattr(request.state, 'request_id', None)
    
    # Log the error
    logger.error(
        f"Application error: {exc.message}",
        service="error_handler",
        request_id=request_id,
        error={
            "code": exc.code,
            "message": exc.message,
            "details": exc.details
        },
        metadata={
            "url": str(request.url),
            "method": request.method,
            "status_code": exc.status_code
        }
    )
    
    response_data = ErrorHandler.create_error_response(exc, request_id)
    return JSONResponse(
        status_code=exc.status_code,
        content=response_data
    )


async def validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle validation exceptions"""
    from app.core.logging import logger
    
    request_id = getattr(request.state, 'request_id', None)
    
    logger.warning(
        f"Validation error: {str(exc)}",
        service="validation",
        request_id=request_id,
        metadata={
            "url": str(request.url),
            "method": request.method
        }
    )
    
    response_data = ErrorHandler.format_validation_error(exc)
    if request_id:
        response_data["error"]["request_id"] = request_id
    
    return JSONResponse(
        status_code=422,
        content=response_data
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions"""
    from app.core.logging import logger
    
    request_id = getattr(request.state, 'request_id', None)
    
    logger.warning(
        f"HTTP error: {exc.detail}",
        service="http",
        request_id=request_id,
        metadata={
            "url": str(request.url),
            "method": request.method,
            "status_code": exc.status_code
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "HTTP_ERROR",
                "message": exc.detail,
                "details": {},
                "timestamp": "2024-12-19T10:30:00Z",
                "request_id": request_id,
                "status_code": exc.status_code
            }
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions"""
    from app.core.logging import logger
    
    request_id = getattr(request.state, 'request_id', None)
    
    logger.critical(
        f"Unhandled exception: {str(exc)}",
        service="error_handler",
        request_id=request_id,
        error={
            "message": str(exc),
            "type": type(exc).__name__
        },
        metadata={
            "url": str(request.url),
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
                "details": {},
                "timestamp": "2024-12-19T10:30:00Z",
                "request_id": request_id,
                "status_code": 500
            }
        }
    )