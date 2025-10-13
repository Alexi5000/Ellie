"""
FastAPI Configuration Management
Centralized configuration with environment-based settings
"""

import os
from functools import lru_cache
from typing import Any, Dict, List, Optional, Union

from pydantic import Field, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application Settings
    APP_NAME: str = "Ellie Voice Receptionist API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = Field(default="development", env="NODE_ENV")
    
    # Server Configuration
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    WORKERS: int = Field(default=1, env="WORKERS")
    
    # CORS Configuration
    FRONTEND_URL: str = Field(default="http://localhost:3000", env="FRONTEND_URL")
    ALLOWED_ORIGINS: List[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    ALLOWED_METHODS: List[str] = Field(default_factory=lambda: ["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    ALLOWED_HEADERS: List[str] = Field(default_factory=lambda: ["*"])
    
    # Security Settings
    SECRET_KEY: str = Field(default="your-secret-key-change-in-production", env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    ALGORITHM: str = "HS256"
    
    # AI Service Configuration
    OPENAI_API_KEY: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    GROQ_API_KEY: Optional[str] = Field(default=None, env="GROQ_API_KEY")
    OPENAI_MODEL: str = Field(default="gpt-3.5-turbo", env="OPENAI_MODEL")
    GROQ_MODEL: str = Field(default="mixtral-8x7b-32768", env="GROQ_MODEL")
    
    # Voice Processing Settings
    MAX_AUDIO_SIZE: int = Field(default=10 * 1024 * 1024, env="MAX_AUDIO_SIZE")  # 10MB
    SUPPORTED_AUDIO_FORMATS: List[str] = Field(default_factory=lambda: ["wav", "mp3", "m4a", "ogg"])
    TTS_VOICE: str = Field(default="alloy", env="TTS_VOICE")
    TTS_MODEL: str = Field(default="tts-1", env="TTS_MODEL")
    
    # Redis Configuration
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    REDIS_PASSWORD: Optional[str] = Field(default=None, env="REDIS_PASSWORD")
    REDIS_DB: int = Field(default=0, env="REDIS_DB")
    CACHE_TTL: int = Field(default=3600, env="CACHE_TTL")  # 1 hour
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_WINDOW: int = Field(default=60, env="RATE_LIMIT_WINDOW")  # seconds
    
    # Circuit Breaker Settings
    CIRCUIT_BREAKER_FAILURE_THRESHOLD: int = Field(default=5, env="CIRCUIT_BREAKER_FAILURE_THRESHOLD")
    CIRCUIT_BREAKER_RECOVERY_TIMEOUT: int = Field(default=60, env="CIRCUIT_BREAKER_RECOVERY_TIMEOUT")
    CIRCUIT_BREAKER_EXPECTED_EXCEPTION: tuple = (Exception,)
    
    # Service Discovery
    SERVICE_DISCOVERY_ENABLED: bool = Field(default=True, env="SERVICE_DISCOVERY_ENABLED")
    HEALTH_CHECK_INTERVAL: int = Field(default=30, env="HEALTH_CHECK_INTERVAL")  # seconds
    SERVICE_TIMEOUT: int = Field(default=30, env="SERVICE_TIMEOUT")  # seconds
    
    # Monitoring and Observability
    PROMETHEUS_ENABLED: bool = Field(default=True, env="PROMETHEUS_ENABLED")
    SENTRY_DSN: Optional[str] = Field(default=None, env="SENTRY_DSN")
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    STRUCTURED_LOGGING: bool = Field(default=True, env="STRUCTURED_LOGGING")
    
    # WebSocket Configuration
    WEBSOCKET_ENABLED: bool = Field(default=True, env="WEBSOCKET_ENABLED")
    MAX_WEBSOCKET_CONNECTIONS: int = Field(default=1000, env="MAX_WEBSOCKET_CONNECTIONS")
    WEBSOCKET_HEARTBEAT_INTERVAL: int = Field(default=25, env="WEBSOCKET_HEARTBEAT_INTERVAL")
    
    # Legal Compliance
    LEGAL_DISCLAIMER_REQUIRED: bool = Field(default=True, env="LEGAL_DISCLAIMER_REQUIRED")
    DATA_RETENTION_DAYS: int = Field(default=30, env="DATA_RETENTION_DAYS")
    GDPR_COMPLIANCE: bool = Field(default=True, env="GDPR_COMPLIANCE")
    
    # Performance Settings
    MAX_CONCURRENT_REQUESTS: int = Field(default=100, env="MAX_CONCURRENT_REQUESTS")
    REQUEST_TIMEOUT: int = Field(default=30, env="REQUEST_TIMEOUT")
    KEEP_ALIVE_TIMEOUT: int = Field(default=5, env="KEEP_ALIVE_TIMEOUT")
    
    # CDN and Static Assets
    CDN_ENABLED: bool = Field(default=False, env="CDN_ENABLED")
    CDN_URL: Optional[str] = Field(default=None, env="CDN_URL")
    STATIC_FILES_CACHE_TTL: int = Field(default=86400, env="STATIC_FILES_CACHE_TTL")  # 24 hours
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
    
    @validator("ALLOWED_ORIGINS", pre=True)
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse CORS origins from string or list"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("SUPPORTED_AUDIO_FORMATS", pre=True)
    def parse_audio_formats(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse supported audio formats from string or list"""
        if isinstance(v, str):
            return [fmt.strip().lower() for fmt in v.split(",")]
        return [fmt.lower() for fmt in v]
    
    @validator("LOG_LEVEL")
    def validate_log_level(cls, v: str) -> str:
        """Validate log level"""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"LOG_LEVEL must be one of {valid_levels}")
        return v.upper()
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.ENVIRONMENT.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.ENVIRONMENT.lower() == "development"
    
    @property
    def is_testing(self) -> bool:
        """Check if running in test environment"""
        return self.ENVIRONMENT.lower() == "test"
    
    @property
    def database_url(self) -> str:
        """Get database URL (placeholder for future database integration)"""
        return os.getenv("DATABASE_URL", "sqlite:///./ellie.db")
    
    @property
    def cors_config(self) -> Dict[str, Any]:
        """Get CORS configuration"""
        return {
            "allow_origins": self.ALLOWED_ORIGINS,
            "allow_credentials": True,
            "allow_methods": self.ALLOWED_METHODS,
            "allow_headers": self.ALLOWED_HEADERS,
        }
    
    @property
    def redis_config(self) -> Dict[str, Any]:
        """Get Redis configuration"""
        return {
            "url": self.REDIS_URL,
            "password": self.REDIS_PASSWORD,
            "db": self.REDIS_DB,
            "decode_responses": True,
            "retry_on_timeout": True,
            "socket_keepalive": True,
            "socket_keepalive_options": {},
        }
    
    @property
    def circuit_breaker_config(self) -> Dict[str, Any]:
        """Get circuit breaker configuration"""
        return {
            "failure_threshold": self.CIRCUIT_BREAKER_FAILURE_THRESHOLD,
            "recovery_timeout": self.CIRCUIT_BREAKER_RECOVERY_TIMEOUT,
            "expected_exception": self.CIRCUIT_BREAKER_EXPECTED_EXCEPTION,
        }
    
    @property
    def rate_limit_config(self) -> Dict[str, Any]:
        """Get rate limiting configuration"""
        return {
            "times": self.RATE_LIMIT_REQUESTS,
            "seconds": self.RATE_LIMIT_WINDOW,
        }


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings"""
    return Settings()


# Global settings instance
settings = get_settings()