"""
Rate Limiting Service
Advanced rate limiting with Redis backend and sliding window
"""

import asyncio
import time
from typing import Dict, Optional, Tuple

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request

from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import RateLimitExceededError
from app.services.cache_service import cache_service


class RateLimiter:
    """Advanced rate limiting service"""
    
    def __init__(self):
        self.limiter = Limiter(
            key_func=get_remote_address,
            storage_uri=settings.REDIS_URL if settings.REDIS_URL else "memory://",
            default_limits=[f"{settings.RATE_LIMIT_REQUESTS}/{settings.RATE_LIMIT_WINDOW}seconds"]
        )
        
        self.stats = {
            "total_requests": 0,
            "blocked_requests": 0,
            "unique_clients": set(),
            "rate_limit_hits": 0
        }
        
        self.client_stats: Dict[str, Dict[str, int]] = {}
    
    async def check_rate_limit(
        self,
        request: Request,
        limit: Optional[str] = None,
        key_func: Optional[callable] = None
    ) -> Tuple[bool, Dict[str, any]]:
        """Check if request is within rate limits"""
        try:
            # Get client identifier
            if key_func:
                client_id = key_func(request)
            else:
                client_id = get_remote_address(request)
            
            # Update stats
            self.stats["total_requests"] += 1
            self.stats["unique_clients"].add(client_id)
            
            # Update client stats
            if client_id not in self.client_stats:
                self.client_stats[client_id] = {
                    "requests": 0,
                    "blocked": 0,
                    "first_seen": int(time.time()),
                    "last_seen": int(time.time())
                }
            
            self.client_stats[client_id]["requests"] += 1
            self.client_stats[client_id]["last_seen"] = int(time.time())
            
            # Use default limit if not specified
            if not limit:
                limit = f"{settings.RATE_LIMIT_REQUESTS}/{settings.RATE_LIMIT_WINDOW}seconds"
            
            # Check rate limit using sliding window
            is_allowed, retry_after = await self._sliding_window_check(client_id, limit)
            
            if not is_allowed:
                self.stats["blocked_requests"] += 1
                self.stats["rate_limit_hits"] += 1
                self.client_stats[client_id]["blocked"] += 1
                
                logger.warning(
                    f"Rate limit exceeded for client: {client_id}",
                    service="rate_limiter",
                    metadata={
                        "client_id": client_id,
                        "limit": limit,
                        "retry_after": retry_after,
                        "user_agent": request.headers.get("user-agent", ""),
                        "path": request.url.path
                    }
                )
                
                return False, {
                    "error": "Rate limit exceeded",
                    "retry_after": retry_after,
                    "limit": limit,
                    "client_id": client_id
                }
            
            return True, {}
            
        except Exception as e:
            logger.error(
                f"Rate limit check error: {str(e)}",
                service="rate_limiter",
                error={"message": str(e), "type": type(e).__name__}
            )
            # Allow request on error (fail open)
            return True, {}
    
    async def _sliding_window_check(self, client_id: str, limit: str) -> Tuple[bool, int]:
        """Sliding window rate limit check"""
        try:
            # Parse limit (e.g., "100/60seconds")
            parts = limit.split("/")
            if len(parts) != 2:
                return True, 0
            
            max_requests = int(parts[0])
            window_parts = parts[1].replace("seconds", "").replace("second", "")
            window_seconds = int(window_parts)
            
            current_time = int(time.time())
            window_start = current_time - window_seconds
            
            # Redis key for this client's requests
            key = f"rate_limit:{client_id}:{window_start // window_seconds}"
            
            # Get current count
            current_count = await cache_service.get(key)
            if current_count is None:
                current_count = 0
            else:
                current_count = int(current_count)
            
            if current_count >= max_requests:
                # Calculate retry after
                retry_after = window_seconds - (current_time % window_seconds)
                return False, retry_after
            
            # Increment counter
            await cache_service.increment(key, 1)
            
            # Set expiration if this is the first request in the window
            if current_count == 0:
                await cache_service.set(key, 1, ttl=window_seconds)
            
            return True, 0
            
        except Exception as e:
            logger.error(
                f"Sliding window check error: {str(e)}",
                service="rate_limiter",
                error={"message": str(e), "type": type(e).__name__}
            )
            return True, 0
    
    async def get_client_stats(self, client_id: str) -> Dict[str, any]:
        """Get statistics for a specific client"""
        return self.client_stats.get(client_id, {})
    
    async def reset_client_limits(self, client_id: str) -> bool:
        """Reset rate limits for a specific client"""
        try:
            # Clear from cache
            pattern = f"rate_limit:{client_id}:*"
            await cache_service.invalidate_pattern(pattern)
            
            # Reset client stats
            if client_id in self.client_stats:
                self.client_stats[client_id]["blocked"] = 0
            
            logger.info(
                f"Rate limits reset for client: {client_id}",
                service="rate_limiter",
                metadata={"client_id": client_id}
            )
            
            return True
            
        except Exception as e:
            logger.error(
                f"Failed to reset client limits: {str(e)}",
                service="rate_limiter",
                error={"message": str(e), "type": type(e).__name__}
            )
            return False
    
    def get_stats(self) -> Dict[str, any]:
        """Get rate limiter statistics"""
        total_requests = self.stats["total_requests"]
        blocked_requests = self.stats["blocked_requests"]
        
        return {
            "total_requests": total_requests,
            "blocked_requests": blocked_requests,
            "allowed_requests": total_requests - blocked_requests,
            "block_rate": (blocked_requests / total_requests * 100) if total_requests > 0 else 0,
            "unique_clients": len(self.stats["unique_clients"]),
            "rate_limit_hits": self.stats["rate_limit_hits"],
            "top_clients": self._get_top_clients(),
            "blocked_clients": self._get_blocked_clients()
        }
    
    def _get_top_clients(self, limit: int = 10) -> list:
        """Get top clients by request count"""
        sorted_clients = sorted(
            self.client_stats.items(),
            key=lambda x: x[1]["requests"],
            reverse=True
        )
        
        return [
            {
                "client_id": client_id,
                "requests": stats["requests"],
                "blocked": stats["blocked"],
                "first_seen": stats["first_seen"],
                "last_seen": stats["last_seen"]
            }
            for client_id, stats in sorted_clients[:limit]
        ]
    
    def _get_blocked_clients(self) -> list:
        """Get clients that have been blocked"""
        return [
            {
                "client_id": client_id,
                "requests": stats["requests"],
                "blocked": stats["blocked"],
                "block_rate": (stats["blocked"] / stats["requests"] * 100) if stats["requests"] > 0 else 0,
                "last_seen": stats["last_seen"]
            }
            for client_id, stats in self.client_stats.items()
            if stats["blocked"] > 0
        ]
    
    async def cleanup_old_stats(self, max_age_seconds: int = 3600) -> None:
        """Clean up old client statistics"""
        current_time = int(time.time())
        cutoff_time = current_time - max_age_seconds
        
        clients_to_remove = [
            client_id for client_id, stats in self.client_stats.items()
            if stats["last_seen"] < cutoff_time
        ]
        
        for client_id in clients_to_remove:
            del self.client_stats[client_id]
        
        if clients_to_remove:
            logger.debug(
                f"Cleaned up {len(clients_to_remove)} old client stats",
                service="rate_limiter",
                metadata={"cleaned_count": len(clients_to_remove)}
            )
    
    def create_limiter_decorator(self, limit: str):
        """Create a rate limiter decorator for specific endpoints"""
        def decorator(func):
            return self.limiter.limit(limit)(func)
        return decorator


# Custom rate limit exceeded handler
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for rate limit exceeded"""
    response = {
        "error": {
            "code": "RATE_LIMIT_EXCEEDED",
            "message": "Rate limit exceeded. Please try again later.",
            "details": {
                "retry_after": exc.retry_after,
                "limit": str(exc.detail)
            },
            "timestamp": time.time(),
            "request_id": getattr(request.state, 'request_id', None)
        }
    }
    
    return response


# Global rate limiter instance
rate_limiter = RateLimiter()