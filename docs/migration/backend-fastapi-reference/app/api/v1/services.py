"""
Service Discovery API Endpoints
FastAPI endpoints for service management and discovery
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.core.logging import logger
from app.core.security import security
from app.services.service_discovery import service_discovery, ServiceInfo
from app.services.health_check import health_service
from app.services.rate_limiter import rate_limiter

router = APIRouter()


class ServiceRegistrationRequest(BaseModel):
    """Service registration request model"""
    name: str = Field(description="Service name")
    version: str = Field(description="Service version")
    host: str = Field(description="Service host")
    port: int = Field(description="Service port", ge=1, le=65535)
    protocol: str = Field(default="http", description="Service protocol")
    health_endpoint: str = Field(default="/health", description="Health check endpoint")
    tags: List[str] = Field(default_factory=list, description="Service tags")
    dependencies: List[str] = Field(default_factory=list, description="Service dependencies")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class ServiceResponse(BaseModel):
    """Service information response model"""
    id: str
    name: str
    version: str
    host: str
    port: int
    protocol: str
    health_endpoint: str
    tags: List[str]
    dependencies: List[str]
    metadata: Dict[str, Any]
    registered_at: str
    last_health_check: Optional[str]
    health_status: str
    consecutive_failures: int
    response_time_ms: Optional[float]


class ServiceListResponse(BaseModel):
    """Service list response model"""
    services: List[ServiceResponse]
    total_count: int
    healthy_count: int
    unhealthy_count: int
    timestamp: str


class ServiceStatsResponse(BaseModel):
    """Service statistics response model"""
    service_discovery: Dict[str, Any]
    health_check: Dict[str, Any]
    timestamp: str


async def get_current_request_id(request: Request) -> str:
    """Get current request ID"""
    return getattr(request.state, 'request_id', 'unknown')


@router.get("/", response_model=ServiceListResponse)
async def list_services(
    request: Request,
    name: Optional[str] = None,
    tag: Optional[str] = None,
    health_status: Optional[str] = None,
    request_id: str = Depends(get_current_request_id)
):
    """
    List all registered services
    
    Optionally filter by service name, tag, or health status.
    """
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    logger.debug(
        "Services list requested",
        service="services_api",
        request_id=request_id,
        metadata={
            "name_filter": name,
            "tag_filter": tag,
            "health_status_filter": health_status
        }
    )
    
    try:
        # Get all services
        all_services = service_discovery.get_all_services()
        
        # Apply filters
        filtered_services = all_services
        
        if name:
            filtered_services = [s for s in filtered_services if s.name == name]
        
        if tag:
            filtered_services = [s for s in filtered_services if tag in s.tags]
        
        if health_status:
            filtered_services = [s for s in filtered_services if s.health_status == health_status]
        
        # Convert to response format
        service_responses = []
        for service in filtered_services:
            service_responses.append(ServiceResponse(
                id=service.id,
                name=service.name,
                version=service.version,
                host=service.host,
                port=service.port,
                protocol=service.protocol,
                health_endpoint=service.health_endpoint,
                tags=service.tags,
                dependencies=service.dependencies,
                metadata=service.metadata,
                registered_at=service.registered_at.isoformat(),
                last_health_check=service.last_health_check.isoformat() if service.last_health_check else None,
                health_status=service.health_status,
                consecutive_failures=service.consecutive_failures,
                response_time_ms=service.response_time_ms
            ))
        
        # Count by health status
        healthy_count = len([s for s in filtered_services if s.health_status == "healthy"])
        unhealthy_count = len([s for s in filtered_services if s.health_status == "unhealthy"])
        
        response = ServiceListResponse(
            services=service_responses,
            total_count=len(service_responses),
            healthy_count=healthy_count,
            unhealthy_count=unhealthy_count,
            timestamp=service_discovery.get_stats()["timestamp"] if "timestamp" in service_discovery.get_stats() else ""
        )
        
        logger.info(
            f"Services list returned {len(service_responses)} services",
            service="services_api",
            request_id=request_id,
            metadata={
                "total_services": len(service_responses),
                "healthy_services": healthy_count,
                "unhealthy_services": unhealthy_count
            }
        )
        
        return response
        
    except Exception as e:
        logger.error(
            f"Failed to list services: {str(e)}",
            service="services_api",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve services"
        )


@router.post("/register")
async def register_service(
    request: Request,
    service_request: ServiceRegistrationRequest,
    request_id: str = Depends(get_current_request_id)
):
    """
    Register a new service
    
    Register a service with the service discovery system.
    """
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    logger.info(
        f"Service registration requested: {service_request.name}",
        service="services_api",
        request_id=request_id,
        metadata={
            "service_name": service_request.name,
            "service_version": service_request.version,
            "host": service_request.host,
            "port": service_request.port,
            "tags": service_request.tags
        }
    )
    
    try:
        # Register the service
        service_id = await service_discovery.register_service({
            "name": service_request.name,
            "version": service_request.version,
            "host": service_request.host,
            "port": service_request.port,
            "protocol": service_request.protocol,
            "health_endpoint": service_request.health_endpoint,
            "tags": service_request.tags,
            "dependencies": service_request.dependencies,
            "metadata": service_request.metadata
        })
        
        logger.info(
            f"Service registered successfully: {service_request.name}",
            service="services_api",
            request_id=request_id,
            metadata={
                "service_id": service_id,
                "service_name": service_request.name
            }
        )
        
        return {
            "service_id": service_id,
            "message": f"Service {service_request.name} registered successfully",
            "timestamp": service_discovery.get_stats().get("timestamp", "")
        }
        
    except Exception as e:
        logger.error(
            f"Failed to register service: {str(e)}",
            service="services_api",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register service: {str(e)}"
        )


@router.delete("/{service_id}")
async def deregister_service(
    request: Request,
    service_id: str,
    request_id: str = Depends(get_current_request_id)
):
    """
    Deregister a service
    
    Remove a service from the service discovery system.
    """
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    logger.info(
        f"Service deregistration requested: {service_id}",
        service="services_api",
        request_id=request_id,
        metadata={"service_id": service_id}
    )
    
    try:
        # Get service info before deregistration
        service_info = service_discovery.get_service(service_id)
        if not service_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Service {service_id} not found"
            )
        
        # Deregister the service
        success = await service_discovery.deregister_service(service_id)
        
        if success:
            logger.info(
                f"Service deregistered successfully: {service_info.name}",
                service="services_api",
                request_id=request_id,
                metadata={
                    "service_id": service_id,
                    "service_name": service_info.name
                }
            )
            
            return {
                "message": f"Service {service_info.name} deregistered successfully",
                "service_id": service_id,
                "timestamp": service_discovery.get_stats().get("timestamp", "")
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to deregister service"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Failed to deregister service: {str(e)}",
            service="services_api",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deregister service: {str(e)}"
        )


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    request: Request,
    service_id: str,
    request_id: str = Depends(get_current_request_id)
):
    """
    Get service details
    
    Retrieve detailed information about a specific service.
    """
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    logger.debug(
        f"Service details requested: {service_id}",
        service="services_api",
        request_id=request_id,
        metadata={"service_id": service_id}
    )
    
    try:
        service_info = service_discovery.get_service(service_id)
        
        if not service_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Service {service_id} not found"
            )
        
        response = ServiceResponse(
            id=service_info.id,
            name=service_info.name,
            version=service_info.version,
            host=service_info.host,
            port=service_info.port,
            protocol=service_info.protocol,
            health_endpoint=service_info.health_endpoint,
            tags=service_info.tags,
            dependencies=service_info.dependencies,
            metadata=service_info.metadata,
            registered_at=service_info.registered_at.isoformat(),
            last_health_check=service_info.last_health_check.isoformat() if service_info.last_health_check else None,
            health_status=service_info.health_status,
            consecutive_failures=service_info.consecutive_failures,
            response_time_ms=service_info.response_time_ms
        )
        
        logger.debug(
            f"Service details returned: {service_info.name}",
            service="services_api",
            request_id=request_id,
            metadata={
                "service_id": service_id,
                "service_name": service_info.name,
                "health_status": service_info.health_status
            }
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Failed to get service details: {str(e)}",
            service="services_api",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve service details"
        )


@router.get("/discover/{service_name}")
async def discover_service(
    request: Request,
    service_name: str,
    tags: Optional[str] = None,
    request_id: str = Depends(get_current_request_id)
):
    """
    Discover a service
    
    Find a healthy instance of a service by name and optional tags.
    """
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    # Parse tags
    tag_list = None
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",")]
    
    logger.debug(
        f"Service discovery requested: {service_name}",
        service="services_api",
        request_id=request_id,
        metadata={
            "service_name": service_name,
            "tags": tag_list
        }
    )
    
    try:
        service_info = await service_discovery.discover_service(service_name, tag_list)
        
        if not service_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No healthy instance of service '{service_name}' found"
            )
        
        response = ServiceResponse(
            id=service_info.id,
            name=service_info.name,
            version=service_info.version,
            host=service_info.host,
            port=service_info.port,
            protocol=service_info.protocol,
            health_endpoint=service_info.health_endpoint,
            tags=service_info.tags,
            dependencies=service_info.dependencies,
            metadata=service_info.metadata,
            registered_at=service_info.registered_at.isoformat(),
            last_health_check=service_info.last_health_check.isoformat() if service_info.last_health_check else None,
            health_status=service_info.health_status,
            consecutive_failures=service_info.consecutive_failures,
            response_time_ms=service_info.response_time_ms
        )
        
        logger.info(
            f"Service discovered: {service_name}",
            service="services_api",
            request_id=request_id,
            metadata={
                "service_name": service_name,
                "service_id": service_info.id,
                "host": service_info.host,
                "port": service_info.port,
                "health_status": service_info.health_status
            }
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Failed to discover service: {str(e)}",
            service="services_api",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to discover service"
        )


@router.get("/stats", response_model=ServiceStatsResponse)
async def get_service_stats(
    request: Request,
    request_id: str = Depends(get_current_request_id)
):
    """
    Get service discovery statistics
    
    Retrieve comprehensive statistics about the service discovery system.
    """
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    logger.debug(
        "Service statistics requested",
        service="services_api",
        request_id=request_id
    )
    
    try:
        service_discovery_stats = service_discovery.get_stats()
        health_check_stats = health_service.get_health_stats()
        
        response = ServiceStatsResponse(
            service_discovery=service_discovery_stats,
            health_check=health_check_stats,
            timestamp=service_discovery_stats.get("timestamp", "")
        )
        
        logger.debug(
            "Service statistics returned",
            service="services_api",
            request_id=request_id,
            metadata={
                "total_services": service_discovery_stats.get("total_services", 0),
                "healthy_services": service_discovery_stats.get("healthy_services", 0)
            }
        )
        
        return response
        
    except Exception as e:
        logger.error(
            f"Failed to get service statistics: {str(e)}",
            service="services_api",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve service statistics"
        )