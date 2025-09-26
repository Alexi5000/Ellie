"""
Security and Authentication Module
JWT tokens, password hashing, and security utilities
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


class SecurityManager:
    """Security utilities for authentication and authorization"""
    
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.algorithm = settings.ALGORITHM
        self.secret_key = settings.SECRET_KEY
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Generate password hash"""
        return self.pwd_context.hash(password)
    
    def create_access_token(
        self,
        data: Dict[str, Any],
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                minutes=self.access_token_expire_minutes
            )
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    def create_api_key(self, identifier: str, permissions: list = None) -> str:
        """Create API key for service-to-service communication"""
        data = {
            "sub": identifier,
            "type": "api_key",
            "permissions": permissions or [],
            "iat": datetime.now(timezone.utc).timestamp()
        }
        return self.create_access_token(data, expires_delta=timedelta(days=365))
    
    def validate_api_key(self, api_key: str) -> Dict[str, Any]:
        """Validate API key and return payload"""
        payload = self.verify_token(api_key)
        
        if payload.get("type") != "api_key":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key type"
            )
        
        return payload
    
    def generate_request_id(self) -> str:
        """Generate unique request ID"""
        import uuid
        return str(uuid.uuid4())
    
    def sanitize_input(self, input_text: str, max_length: int = 1000) -> str:
        """Sanitize user input"""
        if not input_text:
            return ""
        
        # Remove potentially dangerous characters
        sanitized = input_text.strip()
        
        # Limit length
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length]
        
        return sanitized
    
    def validate_audio_file(self, filename: str, file_size: int) -> bool:
        """Validate audio file upload"""
        # Check file extension
        if not filename:
            return False
        
        extension = filename.lower().split('.')[-1]
        if extension not in settings.SUPPORTED_AUDIO_FORMATS:
            return False
        
        # Check file size
        if file_size > settings.MAX_AUDIO_SIZE:
            return False
        
        return True
    
    def get_client_ip(self, request) -> str:
        """Extract client IP address from request"""
        # Check for forwarded headers (when behind proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection
        return request.client.host if request.client else "unknown"


# Global security manager instance
security = SecurityManager()