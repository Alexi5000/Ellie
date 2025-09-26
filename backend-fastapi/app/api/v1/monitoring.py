"""
Monitoring API Endpoints
FastAPI endpoints for system monitoring and observability
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.logging import logger
from app.services.rate_limiter import rate_limiter
from app.services.cache_service import cache_service
from app.services.circuit_breaker import circuit_breaker_manager
from app.services.websocket_manager import websocket_manager

router = APIRouter()


class LogEntry(BaseModel):
    """Log entry model"""
    timestamp: str
    level: str
    service: str
    message: str
    request_id: Optional[str] = None
    user_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[Dict[str, Any]] = None


class LogsResponse(BaseModel):
    """Logs response model"""
    logs: List[LogEntry]
    total_count: int
    filters_applied: Dict[str, Any]
    timestamp: str


class MetricsResponse(BaseModel):
    """Metrics response model"""
    cache: Dict[str, Any]
    circuit_breaker: Dict[str, Any]
    websocket: Dict[str, Any]
    rate_limiter: Dict[str, Any]
    timestamp: str


async def get_current_request_id(request: Request) -> str:
    """Get current request ID"""
    return getattr(request.state, 'request_id', 'unknown')


@router.get("/logs", response_model=LogsResponse)
async def get_logs(
    request: Request,
    count: int = 100,
    level: Optional[str] = None,
    service: Optional[str] = None,
    time_window: Optional[int] = None,
    request_id: str = Depends(get_current_request_id)
):
    """
    Get recent logs
    
    Retrieve recent log entries with optional filtering.
    """
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    logger.debug(
        "Logs requested",
        service="monitoring_api",
        request_id=request_id,
        metadata={
            "count": count,
            "level": level,
            "service": service,
            "time_window": time_window
        }
    )
    
    try:
        # Get logs from logger service
        logs = logger.get_recent_logs(count, level, service, time_window)
        
        # Convert to response format
        log_entries = []
        for log in logs:
            log_entries.append(LogEntry(
                timestamp=log.get("timestamp", ""),
                level=log.get("level", "INFO"),
                service=log.get("service", "unknown"),
                message=log.get("message", ""),
                request_id=log.get("request_id"),
                user_id=log.get("user_id"),
                metadata=log.get("metadata", {}),
                error=log.get("error")
            ))
        
        response = LogsResponse(
            logs=log_entries,
            total_count=len(log_entries),
            filters_applied={
                "count": count,
                "level": level,
                "service": service,
                "time_window": time_window
            },
            timestamp="2024-12-19T10:30:00Z"
        )
        
        logger.debug(
            f"Logs returned: {len(log_entries)} entries",
            service="monitoring_api",
            request_id=request_id,
            metadata={"log_count": len(log_entries)}
        )
        
        return response
        
    except Exception as e:
        logger.error(
            f"Failed to get logs: {str(e)}",
            service="monitoring_api",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve logs"
        )


@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics(
    request: Request,
    request_id: str = Depends(get_current_request_id)
):
    """
    Get system metrics
    
    Retrieve comprehensive system metrics from all services.
    """
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    logger.debug(
        "Metrics requested",
        service="monitoring_api",
        request_id=request_id
    )
    
    try:
        # Gather metrics from all services
        cache_stats = await cache_service.get_cache_stats()
        circuit_breaker_stats = circuit_breaker_manager.get_all_stats()
        websocket_stats = websocket_manager.get_connection_stats()
        rate_limiter_stats = rate_limiter.get_stats()
        
        response = MetricsResponse(
            cache=cache_stats,
            circuit_breaker=circuit_breaker_stats,
            websocket=websocket_stats,
            rate_limiter=rate_limiter_stats,
            timestamp="2024-12-19T10:30:00Z"
        )
        
        logger.debug(
            "Metrics returned",
            service="monitoring_api",
            request_id=request_id,
            metadata={
                "cache_connected": cache_stats.get("connected_to_redis", False),
                "circuit_breakers": len(circuit_breaker_stats),
                "websocket_connections": websocket_stats.get("current_connections", 0)
            }
        )
        
        return response
        
    except Exception as e:
        logger.error(
            f"Failed to get metrics: {str(e)}",
            service="monitoring_api",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve metrics"
        )


@router.get("/errors")
async def get_error_stats(
    request: Request,
    time_window: int = 3600,
    request_id: str = Depends(get_current_request_id)
):
    """
    Get error statistics
    
    Retrieve error statistics for the specified time window.
    """
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    logger.debug(
        "Error statistics requested",
        service="monitoring_api",
        request_id=request_id,
        metadata={"time_window": time_window}
    )
    
    try:
        error_stats = logger.get_error_stats(time_window)
        
        logger.debug(
            "Error statistics returned",
            service="monitoring_api",
            request_id=request_id,
            metadata={
                "total_errors": error_stats.get("total_errors", 0),
                "time_window": time_window
            }
        )
        
        return error_stats
        
    except Exception as e:
        logger.error(
            f"Failed to get error statistics: {str(e)}",
            service="monitoring_api",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve error statistics"
        )


@router.post("/cache/clear")
async def clear_cache(
    request: Request,
    request_id: str = Depends(get_current_request_id)
):
    """
    Clear cache
    
    Clear all cached data.
    """
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    logger.info(
        "Cache clear requested",
        service="monitoring_api",
        request_id=request_id
    )
    
    try:
        success = await cache_service.clear()
        
        if success:
            logger.info(
                "Cache cleared successfully",
                service="monitoring_api",
                request_id=request_id
            )
            
            return {
                "success": True,
                "message": "Cache cleared successfully",
                "timestamp": "2024-12-19T10:30:00Z"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to clear cache"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Failed to clear cache: {str(e)}",
            service="monitoring_api",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear cache: {str(e)}"
        )


@router.delete("/cache/invalidate/{pattern}")
async def invalidate_cache_pattern(
    request: Request,
    pattern: str,
    request_id: str = Depends(get_current_request_id)
):
    """
    Invalidate cache by pattern
    
    Invalidate cache entries matching the specified pattern.
    """
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    logger.info(
        f"Cache invalidation requested: {pattern}",
        service="monitoring_api",
        request_id=request_id,
        metadata={"pattern": pattern}
    )
    
    try:
        count = await cache_service.invalidate_pattern(pattern)
        
        logger.info(
            f"Cache invalidation completed: {count} entries",
            service="monitoring_api",
            request_id=request_id,
            metadata={"pattern": pattern, "count": count}
        )
        
        return {
            "count": count,
            "message": f"Invalidated {count} cache entries",
            "pattern": pattern,
            "timestamp": "2024-12-19T10:30:00Z"
        }
        
    except Exception as e:
        logger.error(
            f"Failed to invalidate cache pattern: {str(e)}",
            service="monitoring_api",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to invalidate cache pattern: {str(e)}"
        )