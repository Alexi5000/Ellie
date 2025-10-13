"""
Health Check Service
Comprehensive system health monitoring and reporting
"""

import asyncio
import psutil
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.core.logging import logger
from app.services.service_discovery import service_discovery


class HealthCheckService:
    """System health monitoring and reporting"""
    
    def __init__(self):
        self.start_time = time.time()
        self.health_checks: Dict[str, Dict[str, Any]] = {}
        self.system_metrics: Dict[str, Any] = {}
        self.running = False
        self.monitoring_task: Optional[asyncio.Task] = None
    
    async def initialize(self) -> None:
        """Initialize health check service"""
        logger.info("Initializing health check service", service="health_check")
        
        self.running = True
        self.start_time = time.time()
        
        # Start system monitoring
        self.monitoring_task = asyncio.create_task(self._monitoring_loop())
        
        logger.info("Health check service initialized", service="health_check")
    
    async def shutdown(self) -> None:
        """Shutdown health check service"""
        logger.info("Shutting down health check service", service="health_check")
        
        self.running = False
        
        if self.monitoring_task:
            self.monitoring_task.cancel()
            try:
                await self.monitoring_task
            except asyncio.CancelledError:
                pass
        
        logger.info("Health check service shut down", service="health_check")
    
    async def get_system_health(self) -> Dict[str, Any]:
        """Get comprehensive system health status"""
        # Get service discovery health
        service_stats = service_discovery.get_stats()
        
        # Get system metrics
        system_metrics = self._get_system_metrics()
        
        # Get external service health
        external_services = await self._check_external_services()
        
        # Determine overall health
        overall_health = self._determine_overall_health(service_stats, system_metrics, external_services)
        
        return {
            "overall": overall_health,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "uptime_seconds": time.time() - self.start_time,
            "environment": settings.ENVIRONMENT,
            "version": settings.APP_VERSION,
            "system": system_metrics,
            "services": {
                "discovery": {
                    "status": "healthy" if service_stats["total_services"] >= 0 else "unhealthy",
                    "total_services": service_stats["total_services"],
                    "healthy_services": service_stats["healthy_services"],
                    "unhealthy_services": service_stats["unhealthy_services"],
                    "average_response_time_ms": service_stats["average_response_time"]
                },
                "external": external_services
            },
            "dependencies": {
                "redis": await self._check_redis_health(),
                "openai": self._check_openai_config(),
                "groq": self._check_groq_config()
            },
            "summary": {
                "healthy_components": self._count_healthy_components(service_stats, external_services),
                "total_components": self._count_total_components(service_stats, external_services),
                "critical_issues": self._get_critical_issues(service_stats, system_metrics)
            }
        }
    
    def _get_system_metrics(self) -> Dict[str, Any]:
        """Get system performance metrics"""
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Memory metrics
            memory = psutil.virtual_memory()
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            
            # Network metrics (if available)
            network = psutil.net_io_counters()
            
            return {
                "cpu": {
                    "usage_percent": cpu_percent,
                    "count": cpu_count,
                    "load_average": psutil.getloadavg() if hasattr(psutil, 'getloadavg') else None
                },
                "memory": {
                    "total_bytes": memory.total,
                    "available_bytes": memory.available,
                    "used_bytes": memory.used,
                    "usage_percent": memory.percent,
                    "free_bytes": memory.free
                },
                "disk": {
                    "total_bytes": disk.total,
                    "used_bytes": disk.used,
                    "free_bytes": disk.free,
                    "usage_percent": (disk.used / disk.total) * 100
                },
                "network": {
                    "bytes_sent": network.bytes_sent,
                    "bytes_recv": network.bytes_recv,
                    "packets_sent": network.packets_sent,
                    "packets_recv": network.packets_recv
                } if network else None,
                "process": {
                    "pid": psutil.Process().pid,
                    "memory_info": psutil.Process().memory_info()._asdict(),
                    "cpu_percent": psutil.Process().cpu_percent(),
                    "num_threads": psutil.Process().num_threads(),
                    "create_time": psutil.Process().create_time()
                }
            }
        except Exception as e:
            logger.error(
                f"Failed to get system metrics: {str(e)}",
                service="health_check",
                error={"message": str(e), "type": type(e).__name__}
            )
            return {"error": str(e)}
    
    async def _check_external_services(self) -> Dict[str, Dict[str, Any]]:
        """Check health of external services"""
        external_services = {}
        
        # Check OpenAI service
        if settings.OPENAI_API_KEY:
            openai_health = await self._check_openai_health()
            external_services["openai"] = openai_health
        
        # Check Groq service
        if settings.GROQ_API_KEY:
            groq_health = await self._check_groq_health()
            external_services["groq"] = groq_health
        
        return external_services
    
    async def _check_openai_health(self) -> Dict[str, Any]:
        """Check OpenAI API health"""
        try:
            import httpx
            
            start_time = time.time()
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
                )
                
                response_time_ms = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    return {
                        "status": "healthy",
                        "response_time_ms": response_time_ms,
                        "last_check": datetime.now(timezone.utc).isoformat()
                    }
                else:
                    return {
                        "status": "degraded",
                        "response_time_ms": response_time_ms,
                        "status_code": response.status_code,
                        "last_check": datetime.now(timezone.utc).isoformat()
                    }
        
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "last_check": datetime.now(timezone.utc).isoformat()
            }
    
    async def _check_groq_health(self) -> Dict[str, Any]:
        """Check Groq API health"""
        try:
            import httpx
            
            start_time = time.time()
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    "https://api.groq.com/openai/v1/models",
                    headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"}
                )
                
                response_time_ms = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    return {
                        "status": "healthy",
                        "response_time_ms": response_time_ms,
                        "last_check": datetime.now(timezone.utc).isoformat()
                    }
                else:
                    return {
                        "status": "degraded",
                        "response_time_ms": response_time_ms,
                        "status_code": response.status_code,
                        "last_check": datetime.now(timezone.utc).isoformat()
                    }
        
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "last_check": datetime.now(timezone.utc).isoformat()
            }
    
    async def _check_redis_health(self) -> Dict[str, Any]:
        """Check Redis health"""
        try:
            from app.services.cache_service import cache_service
            
            if await cache_service.is_available():
                return {
                    "status": "healthy",
                    "last_check": datetime.now(timezone.utc).isoformat()
                }
            else:
                return {
                    "status": "unhealthy",
                    "error": "Redis not available",
                    "last_check": datetime.now(timezone.utc).isoformat()
                }
        
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "last_check": datetime.now(timezone.utc).isoformat()
            }
    
    def _check_openai_config(self) -> Dict[str, Any]:
        """Check OpenAI configuration"""
        return {
            "configured": bool(settings.OPENAI_API_KEY),
            "model": settings.OPENAI_MODEL
        }
    
    def _check_groq_config(self) -> Dict[str, Any]:
        """Check Groq configuration"""
        return {
            "configured": bool(settings.GROQ_API_KEY),
            "model": settings.GROQ_MODEL
        }
    
    def _determine_overall_health(
        self,
        service_stats: Dict[str, Any],
        system_metrics: Dict[str, Any],
        external_services: Dict[str, Dict[str, Any]]
    ) -> str:
        """Determine overall system health"""
        # Check critical system metrics
        if "error" in system_metrics:
            return "unhealthy"
        
        # Check memory usage
        memory = system_metrics.get("memory", {})
        if memory.get("usage_percent", 0) > 90:
            return "degraded"
        
        # Check CPU usage
        cpu = system_metrics.get("cpu", {})
        if cpu.get("usage_percent", 0) > 90:
            return "degraded"
        
        # Check disk usage
        disk = system_metrics.get("disk", {})
        if disk.get("usage_percent", 0) > 90:
            return "degraded"
        
        # Check service discovery
        if service_stats["unhealthy_services"] > service_stats["healthy_services"]:
            return "degraded"
        
        # Check external services
        unhealthy_external = sum(
            1 for service in external_services.values()
            if service.get("status") == "unhealthy"
        )
        
        if unhealthy_external > 0:
            return "degraded"
        
        return "healthy"
    
    def _count_healthy_components(
        self,
        service_stats: Dict[str, Any],
        external_services: Dict[str, Dict[str, Any]]
    ) -> int:
        """Count healthy components"""
        count = 0
        
        # Service discovery components
        count += service_stats["healthy_services"]
        
        # External services
        count += sum(
            1 for service in external_services.values()
            if service.get("status") == "healthy"
        )
        
        return count
    
    def _count_total_components(
        self,
        service_stats: Dict[str, Any],
        external_services: Dict[str, Dict[str, Any]]
    ) -> int:
        """Count total components"""
        return service_stats["total_services"] + len(external_services)
    
    def _get_critical_issues(
        self,
        service_stats: Dict[str, Any],
        system_metrics: Dict[str, Any]
    ) -> List[str]:
        """Get list of critical issues"""
        issues = []
        
        # System resource issues
        memory = system_metrics.get("memory", {})
        if memory.get("usage_percent", 0) > 90:
            issues.append("High memory usage")
        
        cpu = system_metrics.get("cpu", {})
        if cpu.get("usage_percent", 0) > 90:
            issues.append("High CPU usage")
        
        disk = system_metrics.get("disk", {})
        if disk.get("usage_percent", 0) > 90:
            issues.append("High disk usage")
        
        # Service issues
        if service_stats["unhealthy_services"] > 0:
            issues.append(f"{service_stats['unhealthy_services']} unhealthy services")
        
        return issues
    
    async def _monitoring_loop(self) -> None:
        """Background monitoring loop"""
        while self.running:
            try:
                # Update system metrics periodically
                self.system_metrics = self._get_system_metrics()
                
                # Log system health periodically
                if int(time.time()) % 300 == 0:  # Every 5 minutes
                    health_data = await self.get_system_health()
                    logger.info(
                        f"System health: {health_data['overall']}",
                        service="health_check",
                        metadata={
                            "overall_health": health_data["overall"],
                            "healthy_components": health_data["summary"]["healthy_components"],
                            "total_components": health_data["summary"]["total_components"],
                            "uptime_seconds": health_data["uptime_seconds"]
                        }
                    )
                
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(
                    f"Health monitoring error: {str(e)}",
                    service="health_check",
                    error={"message": str(e), "type": type(e).__name__}
                )
                await asyncio.sleep(5)
    
    def get_health_stats(self) -> Dict[str, Any]:
        """Get health check statistics"""
        return {
            "uptime_seconds": time.time() - self.start_time,
            "total_health_checks": len(self.health_checks),
            "system_metrics_available": bool(self.system_metrics),
            "monitoring_active": self.running
        }


# Global health service instance
health_service = HealthCheckService()