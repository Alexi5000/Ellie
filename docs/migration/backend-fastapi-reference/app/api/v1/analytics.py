"""
Analytics API Endpoints
FastAPI endpoints for usage analytics and business metrics
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.logging import logger
from app.services.rate_limiter import rate_limiter

router = APIRouter()


class UsageMetrics(BaseModel):
    """Usage metrics model"""
    total_requests: int = Field(description="Total number of requests")
    voice_requests: int = Field(description="Number of voice processing requests")
    text_requests: int = Field(description="Number of text processing requests")
    unique_users: int = Field(description="Number of unique users")
    average_response_time_ms: float = Field(description="Average response time in milliseconds")
    success_rate: float = Field(description="Success rate percentage")
    time_window_seconds: int = Field(description="Time window for metrics")


class PerformanceMetrics(BaseModel):
    """Performance metrics model"""
    response_times: Dict[str, float] = Field(description="Response time percentiles")
    throughput: Dict[str, float] = Field(description="Request throughput metrics")
    error_rates: Dict[str, float] = Field(description="Error rates by type")
    resource_usage: Dict[str, Any] = Field(description="System resource usage")
    time_window_seconds: int = Field(description="Time window for metrics")


class BusinessMetrics(BaseModel):
    """Business metrics model"""
    daily_active_users: int = Field(description="Daily active users")
    session_duration_avg: float = Field(description="Average session duration in seconds")
    feature_usage: Dict[str, int] = Field(description="Feature usage counts")
    conversion_metrics: Dict[str, float] = Field(description="Conversion metrics")
    time_window_seconds: int = Field(description="Time window for metrics")


async def get_current_request_id(request: Request) -> str:
    """Get current request ID"""
    return getattr(request.state, 'request_id', 'unknown')


@router.get("/usage", response_model=UsageMetrics)
async def get_usage_metrics(
    request: Request,
    time_window: int = 3600,
    request_id: str = Depends(get_current_request_id)
):
    """
    Get usage metrics
    
    Retrieve usage statistics for the specified time window.
    """
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    logger.debug(
        "Usage metrics requested",
        service="analytics_api",
        request_id=request_id,
        metadata={"time_window": time_window}
    )
    
    try:
        # Get request metrics from logger
        request_metrics = logger.get_request_metrics(time_window)
        
        # Calculate usage metrics
        usage_metrics = UsageMetrics(
            total_requests=request_metrics.get("total_requests", 0),
            voice_requests=0,  # Would be calculated from actual data
            text_requests=0,   # Would be calculated from actual data
            unique_users=0,    # Would be calculated from actual data
            average_response_time_ms=request_metrics.get("average_duration_ms", 0.0),
            success_rate=100.0 - request_metrics.get("error_rate", 0.0),
            time_window_seconds=time_window
        )
        
        logger.debug(
            "Usage metrics returned",
            service="analytics_api",
            request_id=request_id,
            metadata={
                "total_requests": usage_metrics.total_requests,
                "success_rate": usage_metrics.success_rate
            }
        )
        
        return usage_metrics
        
    except Exception as e:
        logger.error(
            f"Failed to get usage metrics: {str(e)}",
            service="analytics_api",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve usage metrics"
        )


@router.get("/performance", response_model=PerformanceMetrics)
async def get_performance_metrics(
    request: Request,
    time_window: int = 3600,
    request_id: str = Depends(get_current_request_id)
):
    """
    Get performance metrics
    
    Retrieve performance statistics for the specified time window.
    """
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    logger.debug(
        "Performance metrics requested",
        service="analytics_api",
        request_id=request_id,
        metadata={"time_window": time_window}
    )
    
    try:
        # Get request metrics from logger
        request_metrics = logger.get_request_metrics(time_window)
        
        # Calculate performance metrics
        performance_metrics = PerformanceMetrics(
            response_times={
                "p50": request_metrics.get("average_duration_ms", 0.0),
                "p95": request_metrics.get("max_duration_ms", 0.0),
                "p99": request_metrics.get("max_duration_ms", 0.0),
                "average": request_metrics.get("average_duration_ms", 0.0)
            },
            throughput={
                "requests_per_second": request_metrics.get("total_requests", 0) / (time_window / 60) if time_window > 0 else 0,
                "requests_per_minute": request_metrics.get("total_requests", 0) / (time_window / 60) if time_window > 0 else 0
            },
            error_rates={
                "total_error_rate": request_metrics.get("error_rate", 0.0),
                "4xx_error_rate": 0.0,  # Would be calculated from actual data
                "5xx_error_rate": 0.0   # Would be calculated from actual data
            },
            resource_usage={
                "cpu_usage": 0.0,      # Would be from system metrics
                "memory_usage": 0.0,   # Would be from system metrics
                "disk_usage": 0.0      # Would be from system metrics
            },
            time_window_seconds=time_window
        )
        
        logger.debug(
            "Performance metrics returned",
            service="analytics_api",
            request_id=request_id,
            metadata={
                "average_response_time": performance_metrics.response_times["average"],
                "error_rate": performance_metrics.error_rates["total_error_rate"]
            }
        )
        
        return performance_metrics
        
    except Exception as e:
        logger.error(
            f"Failed to get performance metrics: {str(e)}",
            service="analytics_api",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve performance metrics"
        )


@router.get("/business", response_model=BusinessMetrics)
async def get_business_metrics(
    request: Request,
    time_window: int = 86400,  # Default to 24 hours
    request_id: str = Depends(get_current_request_id)
):
    """
    Get business metrics
    
    Retrieve business-focused statistics for the specified time window.
    """
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    logger.debug(
        "Business metrics requested",
        service="analytics_api",
        request_id=request_id,
        metadata={"time_window": time_window}
    )
    
    try:
        # Calculate business metrics (mock implementation)
        business_metrics = BusinessMetrics(
            daily_active_users=0,      # Would be calculated from actual user data
            session_duration_avg=0.0,  # Would be calculated from session data
            feature_usage={
                "voice_processing": 0,
                "text_processing": 0,
                "legal_disclaimer": 0,
                "health_check": 0
            },
            conversion_metrics={
                "engagement_rate": 0.0,
                "completion_rate": 0.0,
                "retention_rate": 0.0
            },
            time_window_seconds=time_window
        )
        
        logger.debug(
            "Business metrics returned",
            service="analytics_api",
            request_id=request_id,
            metadata={
                "daily_active_users": business_metrics.daily_active_users,
                "session_duration_avg": business_metrics.session_duration_avg
            }
        )
        
        return business_metrics
        
    except Exception as e:
        logger.error(
            f"Failed to get business metrics: {str(e)}",
            service="analytics_api",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve business metrics"
        )


@router.get("/dashboard")
async def get_dashboard_data(
    request: Request,
    time_window: int = 3600,
    request_id: str = Depends(get_current_request_id)
):
    """
    Get dashboard data
    
    Retrieve comprehensive analytics data for dashboard display.
    """
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    logger.debug(
        "Dashboard data requested",
        service="analytics_api",
        request_id=request_id,
        metadata={"time_window": time_window}
    )
    
    try:
        # Get all metrics
        request_metrics = logger.get_request_metrics(time_window)
        log_metrics = logger.get_log_metrics(time_window)
        
        dashboard_data = {
            "summary": {
                "total_requests": request_metrics.get("total_requests", 0),
                "success_rate": 100.0 - request_metrics.get("error_rate", 0.0),
                "average_response_time_ms": request_metrics.get("average_duration_ms", 0.0),
                "total_logs": log_metrics.get("total_logs", 0),
                "error_count": sum(count for level, count in log_metrics.get("level_distribution", {}).items() if level in ["ERROR", "CRITICAL"])
            },
            "request_metrics": request_metrics,
            "log_metrics": log_metrics,
            "time_window_seconds": time_window,
            "timestamp": "2024-12-19T10:30:00Z"
        }
        
        logger.debug(
            "Dashboard data returned",
            service="analytics_api",
            request_id=request_id,
            metadata={
                "total_requests": dashboard_data["summary"]["total_requests"],
                "success_rate": dashboard_data["summary"]["success_rate"]
            }
        )
        
        return dashboard_data
        
    except Exception as e:
        logger.error(
            f"Failed to get dashboard data: {str(e)}",
            service="analytics_api",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve dashboard data"
        )


@router.get("/export")
async def export_analytics_data(
    request: Request,
    format: str = "json",
    time_window: int = 86400,
    request_id: str = Depends(get_current_request_id)
):
    """
    Export analytics data
    
    Export analytics data in the specified format.
    """
    # Rate limiting check
    is_allowed, rate_limit_info = await rate_limiter.check_rate_limit(request)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_info
        )
    
    if format not in ["json", "csv"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format must be 'json' or 'csv'"
        )
    
    logger.info(
        f"Analytics data export requested: {format}",
        service="analytics_api",
        request_id=request_id,
        metadata={"format": format, "time_window": time_window}
    )
    
    try:
        # Get analytics data
        request_metrics = logger.get_request_metrics(time_window)
        log_metrics = logger.get_log_metrics(time_window)
        
        export_data = {
            "export_info": {
                "format": format,
                "time_window_seconds": time_window,
                "exported_at": "2024-12-19T10:30:00Z"
            },
            "request_metrics": request_metrics,
            "log_metrics": log_metrics
        }
        
        if format == "json":
            import json
            content = json.dumps(export_data, indent=2, default=str)
            media_type = "application/json"
            filename = f"analytics-export-{time_window}s.json"
        else:  # csv
            # Simple CSV export (would be more comprehensive in production)
            csv_lines = [
                "metric,value,timestamp",
                f"total_requests,{request_metrics.get('total_requests', 0)},2024-12-19T10:30:00Z",
                f"average_duration_ms,{request_metrics.get('average_duration_ms', 0.0)},2024-12-19T10:30:00Z",
                f"error_rate,{request_metrics.get('error_rate', 0.0)},2024-12-19T10:30:00Z",
                f"total_logs,{log_metrics.get('total_logs', 0)},2024-12-19T10:30:00Z"
            ]
            content = "\n".join(csv_lines)
            media_type = "text/csv"
            filename = f"analytics-export-{time_window}s.csv"
        
        logger.info(
            f"Analytics data exported: {format}",
            service="analytics_api",
            request_id=request_id,
            metadata={"format": format, "size_bytes": len(content)}
        )
        
        from fastapi.responses import Response
        return Response(
            content=content,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "X-Export-Format": format,
                "X-Time-Window": str(time_window)
            }
        )
        
    except Exception as e:
        logger.error(
            f"Failed to export analytics data: {str(e)}",
            service="analytics_api",
            request_id=request_id,
            error={"message": str(e), "type": type(e).__name__}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export analytics data"
        )