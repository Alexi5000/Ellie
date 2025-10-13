"""
Cache Service
Redis-based caching with fallback to in-memory cache
"""

import asyncio
import json
import pickle
import time
from typing import Any, Dict, List, Optional, Union

import aioredis
from aioredis import Redis

from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import CacheError


class CacheService:
    """Redis-based cache service with in-memory fallback"""
    
    def __init__(self):
        self.redis: Optional[Redis] = None
        self.in_memory_cache: Dict[str, Dict[str, Any]] = {}
        self.connected = False
        self.stats = {
            "hits": 0,
            "misses": 0,
            "sets": 0,
            "deletes": 0,
            "errors": 0,
            "fallback_hits": 0
        }
    
    async def initialize(self) -> None:
        """Initialize cache service"""
        logger.info("Initializing cache service", service="cache")
        
        try:
            # Try to connect to Redis
            self.redis = aioredis.from_url(
                settings.REDIS_URL,
                password=settings.REDIS_PASSWORD,
                db=settings.REDIS_DB,
                decode_responses=True,
                retry_on_timeout=True,
                socket_keepalive=True
            )
            
            # Test connection
            await self.redis.ping()
            self.connected = True
            
            logger.info(
                "Cache service initialized with Redis",
                service="cache",
                metadata={"redis_url": settings.REDIS_URL, "redis_db": settings.REDIS_DB}
            )
            
        except Exception as e:
            logger.warning(
                f"Failed to connect to Redis, using in-memory cache: {str(e)}",
                service="cache",
                error={"message": str(e), "type": type(e).__name__}
            )
            self.connected = False
    
    async def shutdown(self) -> None:
        """Shutdown cache service"""
        logger.info("Shutting down cache service", service="cache")
        
        if self.redis:
            await self.redis.close()
        
        self.in_memory_cache.clear()
        logger.info("Cache service shut down", service="cache")
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            if self.connected and self.redis:
                # Try Redis first
                value = await self.redis.get(key)
                if value is not None:
                    self.stats["hits"] += 1
                    try:
                        return json.loads(value)
                    except json.JSONDecodeError:
                        return value
                else:
                    self.stats["misses"] += 1
                    return None
            else:
                # Fallback to in-memory cache
                cache_entry = self.in_memory_cache.get(key)
                if cache_entry:
                    # Check expiration
                    if cache_entry["expires_at"] > time.time():
                        self.stats["fallback_hits"] += 1
                        return cache_entry["value"]
                    else:
                        # Expired, remove from cache
                        del self.in_memory_cache[key]
                
                self.stats["misses"] += 1
                return None
                
        except Exception as e:
            self.stats["errors"] += 1
            logger.error(
                f"Cache get error: {str(e)}",
                service="cache",
                error={"message": str(e), "type": type(e).__name__},
                metadata={"key": key}
            )
            return None
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        serialize: bool = True
    ) -> bool:
        """Set value in cache"""
        try:
            ttl = ttl or settings.CACHE_TTL
            
            if self.connected and self.redis:
                # Use Redis
                if serialize and not isinstance(value, str):
                    value = json.dumps(value, default=str)
                
                await self.redis.setex(key, ttl, value)
                self.stats["sets"] += 1
                return True
            else:
                # Fallback to in-memory cache
                self.in_memory_cache[key] = {
                    "value": value,
                    "expires_at": time.time() + ttl
                }
                self.stats["sets"] += 1
                
                # Clean up expired entries periodically
                if len(self.in_memory_cache) % 100 == 0:
                    await self._cleanup_memory_cache()
                
                return True
                
        except Exception as e:
            self.stats["errors"] += 1
            logger.error(
                f"Cache set error: {str(e)}",
                service="cache",
                error={"message": str(e), "type": type(e).__name__},
                metadata={"key": key, "ttl": ttl}
            )
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        try:
            if self.connected and self.redis:
                result = await self.redis.delete(key)
                self.stats["deletes"] += 1
                return result > 0
            else:
                # Fallback to in-memory cache
                if key in self.in_memory_cache:
                    del self.in_memory_cache[key]
                    self.stats["deletes"] += 1
                    return True
                return False
                
        except Exception as e:
            self.stats["errors"] += 1
            logger.error(
                f"Cache delete error: {str(e)}",
                service="cache",
                error={"message": str(e), "type": type(e).__name__},
                metadata={"key": key}
            )
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        try:
            if self.connected and self.redis:
                return await self.redis.exists(key) > 0
            else:
                cache_entry = self.in_memory_cache.get(key)
                if cache_entry:
                    return cache_entry["expires_at"] > time.time()
                return False
                
        except Exception as e:
            self.stats["errors"] += 1
            logger.error(
                f"Cache exists error: {str(e)}",
                service="cache",
                error={"message": str(e), "type": type(e).__name__},
                metadata={"key": key}
            )
            return False
    
    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment a numeric value in cache"""
        try:
            if self.connected and self.redis:
                return await self.redis.incrby(key, amount)
            else:
                # Fallback implementation
                current = await self.get(key)
                if current is None:
                    current = 0
                new_value = int(current) + amount
                await self.set(key, new_value)
                return new_value
                
        except Exception as e:
            self.stats["errors"] += 1
            logger.error(
                f"Cache increment error: {str(e)}",
                service="cache",
                error={"message": str(e), "type": type(e).__name__},
                metadata={"key": key, "amount": amount}
            )
            return None
    
    async def get_many(self, keys: List[str]) -> Dict[str, Any]:
        """Get multiple values from cache"""
        result = {}
        
        try:
            if self.connected and self.redis:
                values = await self.redis.mget(keys)
                for key, value in zip(keys, values):
                    if value is not None:
                        try:
                            result[key] = json.loads(value)
                        except json.JSONDecodeError:
                            result[key] = value
                        self.stats["hits"] += 1
                    else:
                        self.stats["misses"] += 1
            else:
                # Fallback to in-memory cache
                for key in keys:
                    value = await self.get(key)
                    if value is not None:
                        result[key] = value
            
            return result
            
        except Exception as e:
            self.stats["errors"] += 1
            logger.error(
                f"Cache get_many error: {str(e)}",
                service="cache",
                error={"message": str(e), "type": type(e).__name__},
                metadata={"keys": keys}
            )
            return {}
    
    async def set_many(self, mapping: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Set multiple values in cache"""
        try:
            ttl = ttl or settings.CACHE_TTL
            
            if self.connected and self.redis:
                # Use pipeline for efficiency
                pipe = self.redis.pipeline()
                for key, value in mapping.items():
                    if not isinstance(value, str):
                        value = json.dumps(value, default=str)
                    pipe.setex(key, ttl, value)
                
                await pipe.execute()
                self.stats["sets"] += len(mapping)
                return True
            else:
                # Fallback to in-memory cache
                expires_at = time.time() + ttl
                for key, value in mapping.items():
                    self.in_memory_cache[key] = {
                        "value": value,
                        "expires_at": expires_at
                    }
                
                self.stats["sets"] += len(mapping)
                return True
                
        except Exception as e:
            self.stats["errors"] += 1
            logger.error(
                f"Cache set_many error: {str(e)}",
                service="cache",
                error={"message": str(e), "type": type(e).__name__},
                metadata={"keys": list(mapping.keys())}
            )
            return False
    
    async def clear(self) -> bool:
        """Clear all cache entries"""
        try:
            if self.connected and self.redis:
                await self.redis.flushdb()
            
            self.in_memory_cache.clear()
            
            logger.info("Cache cleared", service="cache")
            return True
            
        except Exception as e:
            self.stats["errors"] += 1
            logger.error(
                f"Cache clear error: {str(e)}",
                service="cache",
                error={"message": str(e), "type": type(e).__name__}
            )
            return False
    
    async def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate cache entries matching pattern"""
        try:
            count = 0
            
            if self.connected and self.redis:
                # Use Redis SCAN to find matching keys
                async for key in self.redis.scan_iter(match=pattern):
                    await self.redis.delete(key)
                    count += 1
            else:
                # Fallback: check in-memory cache
                import fnmatch
                keys_to_delete = [
                    key for key in self.in_memory_cache.keys()
                    if fnmatch.fnmatch(key, pattern)
                ]
                
                for key in keys_to_delete:
                    del self.in_memory_cache[key]
                    count += 1
            
            logger.info(
                f"Invalidated {count} cache entries",
                service="cache",
                metadata={"pattern": pattern, "count": count}
            )
            
            return count
            
        except Exception as e:
            self.stats["errors"] += 1
            logger.error(
                f"Cache invalidate_pattern error: {str(e)}",
                service="cache",
                error={"message": str(e), "type": type(e).__name__},
                metadata={"pattern": pattern}
            )
            return 0
    
    async def _cleanup_memory_cache(self) -> None:
        """Clean up expired entries from in-memory cache"""
        current_time = time.time()
        expired_keys = [
            key for key, entry in self.in_memory_cache.items()
            if entry["expires_at"] <= current_time
        ]
        
        for key in expired_keys:
            del self.in_memory_cache[key]
        
        if expired_keys:
            logger.debug(
                f"Cleaned up {len(expired_keys)} expired cache entries",
                service="cache",
                metadata={"expired_count": len(expired_keys)}
            )
    
    async def is_available(self) -> bool:
        """Check if cache service is available"""
        try:
            if self.connected and self.redis:
                await self.redis.ping()
                return True
            return False  # In-memory cache is always available but we return False for Redis health
        except Exception:
            return False
    
    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        stats = self.stats.copy()
        
        # Add hit rate
        total_requests = stats["hits"] + stats["misses"]
        stats["hit_rate"] = (stats["hits"] / total_requests * 100) if total_requests > 0 else 0
        
        # Add cache info
        stats.update({
            "connected_to_redis": self.connected,
            "in_memory_entries": len(self.in_memory_cache),
            "cache_type": "redis" if self.connected else "in_memory"
        })
        
        # Add Redis info if connected
        if self.connected and self.redis:
            try:
                info = await self.redis.info()
                stats["redis_info"] = {
                    "used_memory": info.get("used_memory", 0),
                    "used_memory_human": info.get("used_memory_human", "0B"),
                    "connected_clients": info.get("connected_clients", 0),
                    "total_commands_processed": info.get("total_commands_processed", 0),
                    "keyspace_hits": info.get("keyspace_hits", 0),
                    "keyspace_misses": info.get("keyspace_misses", 0)
                }
            except Exception as e:
                logger.warning(
                    f"Failed to get Redis info: {str(e)}",
                    service="cache",
                    error={"message": str(e), "type": type(e).__name__}
                )
        
        return stats


# Global cache service instance
cache_service = CacheService()