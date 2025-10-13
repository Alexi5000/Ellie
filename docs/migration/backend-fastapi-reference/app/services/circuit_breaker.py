"""
Circuit Breaker Service
Fault tolerance and resilience patterns for external service calls
"""

import asyncio
import time
from enum import Enum
from typing import Any, Callable, Dict, Optional, Union
from dataclasses import dataclass, field

from circuitbreaker import CircuitBreaker as BaseCircuitBreaker

from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import CircuitBreakerOpenError, ExternalServiceError


class CircuitBreakerState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass
class CircuitBreakerStats:
    """Circuit breaker statistics"""
    name: str
    state: CircuitBreakerState
    failure_count: int = 0
    success_count: int = 0
    total_calls: int = 0
    last_failure_time: Optional[float] = None
    last_success_time: Optional[float] = None
    recovery_timeout: int = 60
    failure_threshold: int = 5
    success_threshold: int = 3
    call_timeout: int = 30
    created_at: float = field(default_factory=time.time)


class CircuitBreakerManager:
    """Manages multiple circuit breakers for different services"""
    
    def __init__(self):
        self.circuit_breakers: Dict[str, BaseCircuitBreaker] = {}
        self.stats: Dict[str, CircuitBreakerStats] = {}
        self.default_config = settings.circuit_breaker_config
    
    def get_or_create_circuit_breaker(
        self,
        name: str,
        failure_threshold: Optional[int] = None,
        recovery_timeout: Optional[int] = None,
        expected_exception: Optional[tuple] = None
    ) -> BaseCircuitBreaker:
        """Get existing circuit breaker or create new one"""
        
        if name not in self.circuit_breakers:
            # Create new circuit breaker
            failure_threshold = failure_threshold or self.default_config["failure_threshold"]
            recovery_timeout = recovery_timeout or self.default_config["recovery_timeout"]
            expected_exception = expected_exception or self.default_config["expected_exception"]
            
            circuit_breaker = BaseCircuitBreaker(
                failure_threshold=failure_threshold,
                recovery_timeout=recovery_timeout,
                expected_exception=expected_exception
            )
            
            # Add event listeners
            circuit_breaker.add_listener(self._on_circuit_breaker_open(name))
            circuit_breaker.add_listener(self._on_circuit_breaker_close(name))
            circuit_breaker.add_listener(self._on_circuit_breaker_half_open(name))
            
            self.circuit_breakers[name] = circuit_breaker
            
            # Initialize stats
            self.stats[name] = CircuitBreakerStats(
                name=name,
                state=CircuitBreakerState.CLOSED,
                failure_threshold=failure_threshold,
                recovery_timeout=recovery_timeout
            )
            
            logger.info(
                f"Created circuit breaker: {name}",
                service="circuit_breaker",
                metadata={
                    "name": name,
                    "failure_threshold": failure_threshold,
                    "recovery_timeout": recovery_timeout
                }
            )
        
        return self.circuit_breakers[name]
    
    def _on_circuit_breaker_open(self, name: str):
        """Callback when circuit breaker opens"""
        def callback():
            if name in self.stats:
                self.stats[name].state = CircuitBreakerState.OPEN
                self.stats[name].last_failure_time = time.time()
            
            logger.warning(
                f"Circuit breaker opened: {name}",
                service="circuit_breaker",
                metadata={
                    "name": name,
                    "failure_count": self.stats[name].failure_count if name in self.stats else 0
                }
            )
        
        return callback
    
    def _on_circuit_breaker_close(self, name: str):
        """Callback when circuit breaker closes"""
        def callback():
            if name in self.stats:
                self.stats[name].state = CircuitBreakerState.CLOSED
                self.stats[name].last_success_time = time.time()
            
            logger.info(
                f"Circuit breaker closed: {name}",
                service="circuit_breaker",
                metadata={
                    "name": name,
                    "success_count": self.stats[name].success_count if name in self.stats else 0
                }
            )
        
        return callback
    
    def _on_circuit_breaker_half_open(self, name: str):
        """Callback when circuit breaker goes half-open"""
        def callback():
            if name in self.stats:
                self.stats[name].state = CircuitBreakerState.HALF_OPEN
            
            logger.info(
                f"Circuit breaker half-open: {name}",
                service="circuit_breaker",
                metadata={"name": name}
            )
        
        return callback
    
    async def call_with_circuit_breaker(
        self,
        name: str,
        func: Callable,
        *args,
        failure_threshold: Optional[int] = None,
        recovery_timeout: Optional[int] = None,
        **kwargs
    ) -> Any:
        """Execute function with circuit breaker protection"""
        
        circuit_breaker = self.get_or_create_circuit_breaker(
            name, failure_threshold, recovery_timeout
        )
        
        # Update stats
        if name in self.stats:
            self.stats[name].total_calls += 1
        
        try:
            # Check if circuit breaker is open
            if circuit_breaker.current_state == "open":
                raise CircuitBreakerOpenError(name)
            
            # Execute function with circuit breaker
            if asyncio.iscoroutinefunction(func):
                result = await circuit_breaker(func)(*args, **kwargs)
            else:
                result = circuit_breaker(func)(*args, **kwargs)
            
            # Update success stats
            if name in self.stats:
                self.stats[name].success_count += 1
                self.stats[name].last_success_time = time.time()
            
            return result
            
        except CircuitBreakerOpenError:
            raise
        except Exception as e:
            # Update failure stats
            if name in self.stats:
                self.stats[name].failure_count += 1
                self.stats[name].last_failure_time = time.time()
            
            logger.error(
                f"Circuit breaker call failed: {name}",
                service="circuit_breaker",
                error={"message": str(e), "type": type(e).__name__},
                metadata={"name": name, "function": func.__name__ if hasattr(func, '__name__') else str(func)}
            )
            
            raise ExternalServiceError(name, str(e))
    
    def get_circuit_breaker_state(self, name: str) -> Optional[CircuitBreakerState]:
        """Get current state of circuit breaker"""
        if name in self.stats:
            return self.stats[name].state
        return None
    
    def get_circuit_breaker_stats(self, name: str) -> Optional[CircuitBreakerStats]:
        """Get statistics for specific circuit breaker"""
        return self.stats.get(name)
    
    def get_all_stats(self) -> Dict[str, Dict[str, Any]]:
        """Get statistics for all circuit breakers"""
        result = {}
        
        for name, stats in self.stats.items():
            circuit_breaker = self.circuit_breakers.get(name)
            
            result[name] = {
                "name": stats.name,
                "state": stats.state.value,
                "failure_count": stats.failure_count,
                "success_count": stats.success_count,
                "total_calls": stats.total_calls,
                "success_rate": (stats.success_count / stats.total_calls * 100) if stats.total_calls > 0 else 0,
                "failure_rate": (stats.failure_count / stats.total_calls * 100) if stats.total_calls > 0 else 0,
                "last_failure_time": stats.last_failure_time,
                "last_success_time": stats.last_success_time,
                "failure_threshold": stats.failure_threshold,
                "recovery_timeout": stats.recovery_timeout,
                "uptime_seconds": time.time() - stats.created_at,
                "current_state": circuit_breaker.current_state if circuit_breaker else "unknown"
            }
        
        return result
    
    def reset_circuit_breaker(self, name: str) -> bool:
        """Reset circuit breaker to closed state"""
        if name in self.circuit_breakers:
            circuit_breaker = self.circuit_breakers[name]
            
            # Reset the circuit breaker
            circuit_breaker._failure_count = 0
            circuit_breaker._last_failure = None
            circuit_breaker._state = "closed"
            
            # Reset stats
            if name in self.stats:
                self.stats[name].state = CircuitBreakerState.CLOSED
                self.stats[name].failure_count = 0
                self.stats[name].last_failure_time = None
            
            logger.info(
                f"Circuit breaker reset: {name}",
                service="circuit_breaker",
                metadata={"name": name}
            )
            
            return True
        
        return False
    
    def remove_circuit_breaker(self, name: str) -> bool:
        """Remove circuit breaker"""
        removed = False
        
        if name in self.circuit_breakers:
            del self.circuit_breakers[name]
            removed = True
        
        if name in self.stats:
            del self.stats[name]
            removed = True
        
        if removed:
            logger.info(
                f"Circuit breaker removed: {name}",
                service="circuit_breaker",
                metadata={"name": name}
            )
        
        return removed
    
    def get_health_summary(self) -> Dict[str, Any]:
        """Get health summary of all circuit breakers"""
        total_breakers = len(self.stats)
        open_breakers = sum(1 for stats in self.stats.values() if stats.state == CircuitBreakerState.OPEN)
        half_open_breakers = sum(1 for stats in self.stats.values() if stats.state == CircuitBreakerState.HALF_OPEN)
        closed_breakers = total_breakers - open_breakers - half_open_breakers
        
        return {
            "total_circuit_breakers": total_breakers,
            "closed": closed_breakers,
            "open": open_breakers,
            "half_open": half_open_breakers,
            "health_status": "healthy" if open_breakers == 0 else "degraded" if open_breakers < total_breakers else "unhealthy",
            "open_breakers": [name for name, stats in self.stats.items() if stats.state == CircuitBreakerState.OPEN]
        }


# Decorator for circuit breaker protection
def circuit_breaker(
    name: str,
    failure_threshold: Optional[int] = None,
    recovery_timeout: Optional[int] = None
):
    """Decorator to add circuit breaker protection to functions"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            return await circuit_breaker_manager.call_with_circuit_breaker(
                name, func, *args,
                failure_threshold=failure_threshold,
                recovery_timeout=recovery_timeout,
                **kwargs
            )
        return wrapper
    return decorator


# Global circuit breaker manager instance
circuit_breaker_manager = CircuitBreakerManager()