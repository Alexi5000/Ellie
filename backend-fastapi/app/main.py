"""
Ellie Voice Receptionist FastAPI Application
Enterprise-grade AI voice assistant with microservices architecture
"""

import asyncio
import time
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
import uvicorn

from app.core.config import settings
from app.core.logging import logger
from app.core.security import security
from app.core.exceptions import (
    EllieException,
    ellie_exception_handler,
    validation_exception_handler,
    http_exception_handler,
    general_exception_handler
)

# Import services
from app.services.service_discovery import service_discovery
from app.services.health_check import health_service
from app.services.rate_limiter import rate_limiter
from app.services.cache_service import cache_service
from app.services.circuit_breaker import circuit_breaker_manager
from app.services.websocket_manager import websocket_manager

# Import routers
from app.api.v1.voice import router as voice_router
from app.api.v1.legal import router as legal_router
from app.api.v1.monitoring import router as monitoring_router
from app.api.v1.services import router as services_router
from app.api.v1.analytics import router as analytics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("Starting Ellie Voice Receptionist API", service="main")
    
    try:
        # Initialize services
        await cache_service.initialize()
        await service_discovery.initialize()
        await health_service.initialize()
        await websocket_manager.initialize()
        
        # Register this service
        await service_discovery.register_service({
            "name": "ellie-backend-fastapi",
            "version": settings.APP_VERSION,
            "host": settings.HOST,
            "port": settings.PORT,
            "protocol": "http",
            "health_endpoint": "/health",
            "tags": ["api", "backend", "fastapi", "critical"],
            "dependencies": [],
            "metadata": {
                "environment": settings.ENVIRONMENT,
                "cors_origin": settings.FRONTEND_URL,
                "weight": 1,
                "framework": "fastapi"
            }
        })
        
        logger.info(
            "All services initialized successfully",
            service="main",
            metadata={
                "environment": settings.ENVIRONMENT,
                "host": settings.HOST,
                "port": settings.PORT
            }
        )
        
        yield
        
    except Exception as e:
        logger.critical(
            f"Failed to initialize services: {str(e)}",
            service="main",
            error={"message": str(e), "type": type(e).__name__}
        )
        raise
    
    # Shutdown
    logger.info("Shutting down Ellie Voice Receptionist API", service="main")
    
    try:
        await websocket_manager.shutdown()
        await service_discovery.shutdown()
        await health_service.shutdown()
        await cache_service.shutdown()
        
        logger.info("All services shut down successfully", service="main")
        
    except Exception as e:
        logger.error(
            f"Error during shutdown: {str(e)}",
            service="main",
            error={"message": str(e), "type": type(e).__name__}
        )


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise-grade AI voice assistant for legal professionals",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
    lifespan=lifespan
)

# Add middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    **settings.cors_config
)

if settings.is_production:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"]  # Configure appropriately for production
    )


# Request middleware for logging and metrics
@app.middleware("http")
async def request_middleware(request: Request, call_next):
    """Request processing middleware"""
    start_time = time.time()
    request_id = security.generate_request_id()
    
    # Add request ID to state
    request.state.request_id = request_id
    
    # Get client IP
    client_ip = security.get_client_ip(request)
    
    # Log request start
    logger.info(
        f"Incoming request: {request.method} {request.url.path}",
        service="http",
        request_id=request_id,
        metadata={
            "method": request.method,
            "url": str(request.url),
            "client_ip": client_ip,
            "user_agent": request.headers.get("user-agent", ""),
            "content_type": request.headers.get("content-type", "")
        }
    )
    
    try:
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000
        
        # Log response
        logger.log_request(
            method=request.method,
            url=str(request.url.path),
            status_code=response.status_code,
            duration_ms=duration_ms,
            request_id=request_id,
            client_ip=client_ip
        )
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        return response
        
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        
        logger.error(
            f"Request failed: {request.method} {request.url.path}",
            service="http",
            request_id=request_id,
            error={
                "message": str(e),
                "type": type(e).__name__
            },
            metadata={
                "duration_ms": duration_ms,
                "client_ip": client_ip
            }
        )
        
        raise


# Exception handlers
app.add_exception_handler(EllieException, ellie_exception_handler)
app.add_exception_handler(422, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)


# Health check endpoint
@app.get("/health")
async def health_check(request: Request):
    """Comprehensive health check endpoint"""
    request_id = getattr(request.state, 'request_id', None)
    
    try:
        health_data = await health_service.get_system_health()
        
        logger.debug(
            "Health check requested",
            service="health",
            request_id=request_id
        )
        
        status_code = 200 if health_data["overall"] == "healthy" else 503
        return JSONResponse(content=health_data, status_code=status_code)
        
    except Exception as e:
        logger.error(
            f"Health check failed: {str(e)}",
            service="health",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__}
        )
        
        return JSONResponse(
            content={
                "overall": "unhealthy",
                "error": str(e),
                "timestamp": time.time()
            },
            status_code=503
        )


# Metrics endpoint for Prometheus
@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


# Root endpoint
@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Ellie Voice Receptionist API",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "docs_url": "/docs" if not settings.is_production else None,
        "health_url": "/health",
        "metrics_url": "/metrics",
        "endpoints": {
            "voice": "/api/v1/voice",
            "legal": "/api/v1/legal",
            "services": "/api/v1/services",
            "monitoring": "/api/v1/monitoring",
            "analytics": "/api/v1/analytics",
            "websocket": "/ws"
        }
    }


# API version info
@app.get("/api")
async def api_info():
    """API information endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "framework": "FastAPI",
        "python_version": "3.11+",
        "features": [
            "Voice Processing",
            "AI Integration",
            "Service Discovery",
            "Circuit Breaker",
            "Rate Limiting",
            "WebSocket Support",
            "Prometheus Metrics",
            "Structured Logging",
            "Health Monitoring"
        ]
    }


# Include API routers
app.include_router(
    voice_router,
    prefix="/api/v1/voice",
    tags=["Voice Processing"]
)

app.include_router(
    legal_router,
    prefix="/api/v1/legal",
    tags=["Legal Compliance"]
)

app.include_router(
    services_router,
    prefix="/api/v1/services",
    tags=["Service Discovery"]
)

app.include_router(
    monitoring_router,
    prefix="/api/v1/monitoring",
    tags=["Monitoring"]
)

app.include_router(
    analytics_router,
    prefix="/api/v1/analytics",
    tags=["Analytics"]
)

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket):
    """WebSocket endpoint for real-time communication"""
    await websocket_manager.handle_connection(websocket)


if __name__ == "__main__":
    # Development server
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.is_development,
        workers=1 if settings.is_development else settings.WORKERS,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True
    )