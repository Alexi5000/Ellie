"""
Service Discovery System
FastAPI implementation of microservices discovery and management
"""

import asyncio
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

import httpx
from pydantic import BaseModel

from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import ServiceUnavailableError


class ServiceInfo(BaseModel):
    """Service information model"""
    id: str
    name: str
    version: str
    host: str
    port: int
    protocol: str = "http"
    health_endpoint: str = "/health"
    tags: List[str] = []
    dependencies: List[str] = []
    metadata: Dict[str, Any] = {}
    registered_at: datetime
    last_health_check: Optional[datetime] = None
    health_status: str = "unknown"  # healthy, unhealthy, degraded
    consecutive_failures: int = 0
    response_time_ms: Optional[float] = None


class ServiceDiscovery:
    """Service discovery and registry management"""
    
    def __init__(self):
        self.services: Dict[str, ServiceInfo] = {}
        self.health_check_task: Optional[asyncio.Task] = None
        self.running = False
        self.stats = {
            "total_services": 0,
            "healthy_services": 0,
            "unhealthy_services": 0,
            "total_health_checks": 0,
            "failed_health_checks": 0,
            "average_response_time": 0.0
        }
    
    async def initialize(self) -> None:
        """Initialize service discovery"""
        logger.info("Initializing service discovery", service="service_discovery")
        
        self.running = True
        
        # Start health check task
        if settings.SERVICE_DISCOVERY_ENABLED:
            self.health_check_task = asyncio.create_task(self._health_check_loop())
        
        logger.info("Service discovery initialized", service="service_discovery")
    
    async def shutdown(self) -> None:
        """Shutdown service discovery"""
        logger.info("Shutting down service discovery", service="service_discovery")
        
        self.running = False
        
        if self.health_check_task:
            self.health_check_task.cancel()
            try:
                await self.health_check_task
            except asyncio.CancelledError:
                pass
        
        logger.info("Service discovery shut down", service="service_discovery")
    
    async def register_service(self, service_data: Dict[str, Any]) -> str:
        """Register a new service"""
        service_id = service_data.get("id", str(uuid4()))
        
        service_info = ServiceInfo(
            id=service_id,
            name=service_data["name"],
            version=service_data["version"],
            host=service_data["host"],
            port=service_data["port"],
            protocol=service_data.get("protocol", "http"),
            health_endpoint=service_data.get("health_endpoint", "/health"),
            tags=service_data.get("tags", []),
            dependencies=service_data.get("dependencies", []),
            metadata=service_data.get("metadata", {}),
            registered_at=datetime.now(timezone.utc)
        )
        
        self.services[service_id] = service_info
        self.stats["total_services"] = len(self.services)
        
        logger.info(
            f"Service registered: {service_info.name}",
            service="service_discovery",
            metadata={
                "service_id": service_id,
                "service_name": service_info.name,
                "host": service_info.host,
                "port": service_info.port,
                "tags": service_info.tags
            }
        )
        
        return service_id
    
    async def deregister_service(self, service_id: str) -> bool:
        """Deregister a service"""
        if service_id in self.services:
            service_info = self.services.pop(service_id)
            self.stats["total_services"] = len(self.services)
            
            logger.info(
                f"Service deregistered: {service_info.name}",
                service="service_discovery",
                metadata={"service_id": service_id, "service_name": service_info.name}
            )
            
            return True
        
        return False
    
    def get_service(self, service_id: str) -> Optional[ServiceInfo]:
        """Get service by ID"""
        return self.services.get(service_id)
    
    def get_services_by_name(self, name: str) -> List[ServiceInfo]:
        """Get all services with a specific name"""
        return [service for service in self.services.values() if service.name == name]
    
    def get_services_by_tag(self, tag: str) -> List[ServiceInfo]:
        """Get all services with a specific tag"""
        return [service for service in self.services.values() if tag in service.tags]
    
    def get_healthy_services(self, name: Optional[str] = None) -> List[ServiceInfo]:
        """Get all healthy services, optionally filtered by name"""
        services = self.services.values()
        
        if name:
            services = [s for s in services if s.name == name]
        
        return [s for s in services if s.health_status == "healthy"]
    
    def get_all_services(self) -> List[ServiceInfo]:
        """Get all registered services"""
        return list(self.services.values())
    
    async def discover_service(self, name: str, tags: Optional[List[str]] = None) -> Optional[ServiceInfo]:
        """Discover a service by name and optional tags"""
        services = self.get_services_by_name(name)
        
        if tags:
            services = [s for s in services if all(tag in s.tags for tag in tags)]
        
        # Return healthy service with best response time
        healthy_services = [s for s in services if s.health_status == "healthy"]
        
        if healthy_services:
            return min(healthy_services, key=lambda s: s.response_time_ms or float('inf'))
        
        # Fallback to any available service
        if services:
            return services[0]
        
        return None
    
    async def _health_check_loop(self) -> None:
        """Background health check loop"""
        while self.running:
            try:
                await self._perform_health_checks()
                await asyncio.sleep(settings.HEALTH_CHECK_INTERVAL)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(
                    f"Health check loop error: {str(e)}",
                    service="service_discovery",
                    error={"message": str(e), "type": type(e).__name__}
                )
                await asyncio.sleep(5)  # Short delay before retry
    
    async def _perform_health_checks(self) -> None:
        """Perform health checks on all services"""
        if not self.services:
            return
        
        logger.debug(
            f"Performing health checks on {len(self.services)} services",
            service="service_discovery"
        )
        
        # Create health check tasks
        tasks = []
        for service_id, service_info in self.services.items():
            task = asyncio.create_task(self._check_service_health(service_id, service_info))
            tasks.append(task)
        
        # Wait for all health checks to complete
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        
        # Update stats
        self._update_health_stats()
    
    async def _check_service_health(self, service_id: str, service_info: ServiceInfo) -> None:
        """Check health of a single service"""
        if not service_info.health_endpoint:
            return
        
        url = f"{service_info.protocol}://{service_info.host}:{service_info.port}{service_info.health_endpoint}"
        
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=settings.SERVICE_TIMEOUT) as client:
                response = await client.get(url)
                
                response_time_ms = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    service_info.health_status = "healthy"
                    service_info.consecutive_failures = 0
                    service_info.response_time_ms = response_time_ms
                    
                    logger.debug(
                        f"Health check passed: {service_info.name}",
                        service="service_discovery",
                        metadata={
                            "service_id": service_id,
                            "response_time_ms": response_time_ms,
                            "status_code": response.status_code
                        }
                    )
                else:
                    service_info.health_status = "degraded"
                    service_info.consecutive_failures += 1
                    
                    logger.warning(
                        f"Health check degraded: {service_info.name}",
                        service="service_discovery",
                        metadata={
                            "service_id": service_id,
                            "status_code": response.status_code,
                            "consecutive_failures": service_info.consecutive_failures
                        }
                    )
                
                service_info.last_health_check = datetime.now(timezone.utc)
                self.stats["total_health_checks"] += 1
                
        except Exception as e:
            service_info.health_status = "unhealthy"
            service_info.consecutive_failures += 1
            service_info.last_health_check = datetime.now(timezone.utc)
            
            self.stats["total_health_checks"] += 1
            self.stats["failed_health_checks"] += 1
            
            logger.warning(
                f"Health check failed: {service_info.name}",
                service="service_discovery",
                error={"message": str(e), "type": type(e).__name__},
                metadata={
                    "service_id": service_id,
                    "consecutive_failures": service_info.consecutive_failures,
                    "url": url
                }
            )
    
    def _update_health_stats(self) -> None:
        """Update health statistics"""
        healthy_count = 0
        unhealthy_count = 0
        total_response_time = 0
        response_time_count = 0
        
        for service in self.services.values():
            if service.health_status == "healthy":
                healthy_count += 1
                if service.response_time_ms:
                    total_response_time += service.response_time_ms
                    response_time_count += 1
            elif service.health_status == "unhealthy":
                unhealthy_count += 1
        
        self.stats.update({
            "healthy_services": healthy_count,
            "unhealthy_services": unhealthy_count,
            "average_response_time": total_response_time / response_time_count if response_time_count > 0 else 0.0
        })
    
    def get_stats(self) -> Dict[str, Any]:
        """Get service discovery statistics"""
        return {
            **self.stats,
            "services_by_status": {
                "healthy": len([s for s in self.services.values() if s.health_status == "healthy"]),
                "degraded": len([s for s in self.services.values() if s.health_status == "degraded"]),
                "unhealthy": len([s for s in self.services.values() if s.health_status == "unhealthy"]),
                "unknown": len([s for s in self.services.values() if s.health_status == "unknown"])
            },
            "services_by_tag": self._get_services_by_tag_stats(),
            "uptime_seconds": time.time() - getattr(self, '_start_time', time.time())
        }
    
    def _get_services_by_tag_stats(self) -> Dict[str, int]:
        """Get service count by tags"""
        tag_counts = {}
        for service in self.services.values():
            for tag in service.tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        return tag_counts
    
    async def get_service_dependencies(self, service_name: str) -> List[str]:
        """Get dependencies for a service"""
        services = self.get_services_by_name(service_name)
        if services:
            return services[0].dependencies
        return []
    
    async def check_service_availability(self, service_name: str) -> bool:
        """Check if a service is available"""
        healthy_services = self.get_healthy_services(service_name)
        return len(healthy_services) > 0


# Global service discovery instance
service_discovery = ServiceDiscovery()