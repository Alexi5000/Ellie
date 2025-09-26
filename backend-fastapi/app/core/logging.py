"""
Advanced Structured Logging System
Enterprise-grade logging with structured output, metrics, and monitoring
"""

import asyncio
import json
import logging
import sys
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union
from uuid import uuid4

import structlog
from structlog.stdlib import LoggerFactory

from app.core.config import settings


class StructuredLogger:
    """Advanced structured logger with metrics and monitoring capabilities"""
    
    def __init__(self):
        self.configure_structlog()
        self.logger = structlog.get_logger()
        self._log_buffer: List[Dict[str, Any]] = []
        self._error_counts: Dict[str, int] = {}
        self._request_metrics: List[Dict[str, Any]] = []
        self._alerts: List[Dict[str, Any]] = []
        
    def configure_structlog(self) -> None:
        """Configure structured logging"""
        processors = [
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
        ]
        
        if settings.STRUCTURED_LOGGING:
            processors.append(structlog.processors.JSONRenderer())
        else:
            processors.append(structlog.dev.ConsoleRenderer())
        
        structlog.configure(
            processors=processors,
            wrapper_class=structlog.stdlib.BoundLogger,
            logger_factory=LoggerFactory(),
            cache_logger_on_first_use=True,
        )
        
        # Configure standard library logging
        logging.basicConfig(
            format="%(message)s",
            stream=sys.stdout,
            level=getattr(logging, settings.LOG_LEVEL),
        )
    
    def _add_to_buffer(self, log_entry: Dict[str, Any]) -> None:
        """Add log entry to buffer for analysis"""
        self._log_buffer.append(log_entry)
        
        # Keep buffer size manageable
        if len(self._log_buffer) > 10000:
            self._log_buffer = self._log_buffer[-5000:]
    
    def _update_error_counts(self, level: str, service: str) -> None:
        """Update error counts for monitoring"""
        if level in ["ERROR", "CRITICAL"]:
            key = f"{service}:{level}"
            self._error_counts[key] = self._error_counts.get(key, 0) + 1
    
    def _check_alerts(self, log_entry: Dict[str, Any]) -> None:
        """Check for alert conditions"""
        level = log_entry.get("level", "").upper()
        service = log_entry.get("service", "unknown")
        
        # High error rate alert
        if level == "ERROR":
            error_key = f"{service}:ERROR"
            if self._error_counts.get(error_key, 0) > 10:  # More than 10 errors
                alert = {
                    "id": str(uuid4()),
                    "type": "high_error_rate",
                    "service": service,
                    "message": f"High error rate detected in {service}",
                    "count": self._error_counts[error_key],
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "severity": "warning",
                    "resolved": False
                }
                self._alerts.append(alert)
        
        # Critical error alert
        if level == "CRITICAL":
            alert = {
                "id": str(uuid4()),
                "type": "critical_error",
                "service": service,
                "message": log_entry.get("message", "Critical error occurred"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "severity": "critical",
                "resolved": False,
                "details": log_entry
            }
            self._alerts.append(alert)
    
    def log(
        self,
        level: str,
        message: str,
        service: str = "app",
        request_id: Optional[str] = None,
        user_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        error: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> None:
        """Enhanced logging with structured data"""
        log_entry = {
            "message": message,
            "level": level.upper(),
            "service": service,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "request_id": request_id,
            "user_id": user_id,
            "metadata": metadata or {},
            "error": error,
            **kwargs
        }
        
        # Add to buffer and update metrics
        self._add_to_buffer(log_entry)
        self._update_error_counts(level.upper(), service)
        self._check_alerts(log_entry)
        
        # Log using structlog
        logger_method = getattr(self.logger, level.lower(), self.logger.info)
        logger_method(
            message,
            service=service,
            request_id=request_id,
            user_id=user_id,
            metadata=metadata,
            error=error,
            **kwargs
        )
    
    def debug(self, message: str, **kwargs) -> None:
        """Debug level logging"""
        self.log("DEBUG", message, **kwargs)
    
    def info(self, message: str, **kwargs) -> None:
        """Info level logging"""
        self.log("INFO", message, **kwargs)
    
    def warning(self, message: str, **kwargs) -> None:
        """Warning level logging"""
        self.log("WARNING", message, **kwargs)
    
    def error(self, message: str, **kwargs) -> None:
        """Error level logging"""
        self.log("ERROR", message, **kwargs)
    
    def critical(self, message: str, **kwargs) -> None:
        """Critical level logging"""
        self.log("CRITICAL", message, **kwargs)
    
    def log_request(
        self,
        method: str,
        url: str,
        status_code: int,
        duration_ms: float,
        request_id: str,
        user_id: Optional[str] = None,
        **kwargs
    ) -> None:
        """Log HTTP request with metrics"""
        request_metric = {
            "method": method,
            "url": url,
            "status_code": status_code,
            "duration_ms": duration_ms,
            "request_id": request_id,
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **kwargs
        }
        
        self._request_metrics.append(request_metric)
        
        # Keep metrics buffer manageable
        if len(self._request_metrics) > 10000:
            self._request_metrics = self._request_metrics[-5000:]
        
        level = "ERROR" if status_code >= 500 else "WARNING" if status_code >= 400 else "INFO"
        
        self.log(
            level,
            f"{method} {url} - {status_code} ({duration_ms:.2f}ms)",
            service="http",
            request_id=request_id,
            user_id=user_id,
            metadata={
                "method": method,
                "url": url,
                "status_code": status_code,
                "duration_ms": duration_ms,
                **kwargs
            }
        )
    
    def get_recent_logs(
        self,
        count: int = 100,
        level: Optional[str] = None,
        service: Optional[str] = None,
        time_window: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get recent logs with filtering"""
        logs = self._log_buffer.copy()
        
        # Filter by level
        if level:
            logs = [log for log in logs if log.get("level") == level.upper()]
        
        # Filter by service
        if service:
            logs = [log for log in logs if log.get("service") == service]
        
        # Filter by time window (seconds)
        if time_window:
            cutoff_time = datetime.now(timezone.utc).timestamp() - time_window
            logs = [
                log for log in logs
                if datetime.fromisoformat(log["timestamp"].replace("Z", "+00:00")).timestamp() > cutoff_time
            ]
        
        # Sort by timestamp (newest first) and limit
        logs.sort(key=lambda x: x["timestamp"], reverse=True)
        return logs[:count]
    
    def get_error_stats(self, time_window: Optional[int] = None) -> Dict[str, Any]:
        """Get error statistics"""
        if time_window:
            # Filter recent errors
            cutoff_time = datetime.now(timezone.utc).timestamp() - time_window
            recent_logs = [
                log for log in self._log_buffer
                if (
                    log.get("level") in ["ERROR", "CRITICAL"] and
                    datetime.fromisoformat(log["timestamp"].replace("Z", "+00:00")).timestamp() > cutoff_time
                )
            ]
            
            error_counts = {}
            for log in recent_logs:
                service = log.get("service", "unknown")
                level = log.get("level", "ERROR")
                key = f"{service}:{level}"
                error_counts[key] = error_counts.get(key, 0) + 1
            
            return {
                "time_window_seconds": time_window,
                "total_errors": len(recent_logs),
                "error_counts": error_counts,
                "error_rate": len(recent_logs) / (time_window / 60) if time_window > 0 else 0  # errors per minute
            }
        
        return {
            "total_error_counts": self._error_counts.copy(),
            "total_errors": sum(self._error_counts.values())
        }
    
    def get_request_metrics(self, time_window: Optional[int] = None) -> Dict[str, Any]:
        """Get request metrics and statistics"""
        metrics = self._request_metrics.copy()
        
        if time_window:
            cutoff_time = datetime.now(timezone.utc).timestamp() - time_window
            metrics = [
                metric for metric in metrics
                if datetime.fromisoformat(metric["timestamp"].replace("Z", "+00:00")).timestamp() > cutoff_time
            ]
        
        if not metrics:
            return {"total_requests": 0, "average_duration_ms": 0, "status_codes": {}}
        
        # Calculate statistics
        durations = [m["duration_ms"] for m in metrics]
        status_codes = {}
        
        for metric in metrics:
            status = metric["status_code"]
            status_codes[status] = status_codes.get(status, 0) + 1
        
        return {
            "total_requests": len(metrics),
            "average_duration_ms": sum(durations) / len(durations),
            "min_duration_ms": min(durations),
            "max_duration_ms": max(durations),
            "status_codes": status_codes,
            "error_rate": sum(1 for m in metrics if m["status_code"] >= 400) / len(metrics) * 100,
            "time_window_seconds": time_window
        }
    
    def search_logs(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Search logs with advanced filtering"""
        logs = self._log_buffer.copy()
        
        # Apply filters
        if filters.get("level"):
            logs = [log for log in logs if log.get("level") == filters["level"].upper()]
        
        if filters.get("service"):
            logs = [log for log in logs if log.get("service") == filters["service"]]
        
        if filters.get("message"):
            search_term = filters["message"].lower()
            logs = [log for log in logs if search_term in log.get("message", "").lower()]
        
        if filters.get("request_id"):
            logs = [log for log in logs if log.get("request_id") == filters["request_id"]]
        
        if filters.get("user_id"):
            logs = [log for log in logs if log.get("user_id") == filters["user_id"]]
        
        if filters.get("time_window"):
            cutoff_time = datetime.now(timezone.utc).timestamp() - filters["time_window"]
            logs = [
                log for log in logs
                if datetime.fromisoformat(log["timestamp"].replace("Z", "+00:00")).timestamp() > cutoff_time
            ]
        
        # Sort and limit
        logs.sort(key=lambda x: x["timestamp"], reverse=True)
        limit = filters.get("limit", 100)
        return logs[:limit]
    
    def get_log_metrics(self, time_window: int = 3600) -> Dict[str, Any]:
        """Get comprehensive log metrics"""
        cutoff_time = datetime.now(timezone.utc).timestamp() - time_window
        recent_logs = [
            log for log in self._log_buffer
            if datetime.fromisoformat(log["timestamp"].replace("Z", "+00:00")).timestamp() > cutoff_time
        ]
        
        # Count by level
        level_counts = {}
        service_counts = {}
        
        for log in recent_logs:
            level = log.get("level", "INFO")
            service = log.get("service", "unknown")
            
            level_counts[level] = level_counts.get(level, 0) + 1
            service_counts[service] = service_counts.get(service, 0) + 1
        
        return {
            "time_window_seconds": time_window,
            "total_logs": len(recent_logs),
            "level_distribution": level_counts,
            "service_distribution": service_counts,
            "logs_per_minute": len(recent_logs) / (time_window / 60) if time_window > 0 else 0
        }
    
    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get active alerts"""
        return [alert for alert in self._alerts if not alert.get("resolved", False)]
    
    def resolve_alert(self, alert_id: str) -> bool:
        """Resolve an alert by ID"""
        for alert in self._alerts:
            if alert["id"] == alert_id:
                alert["resolved"] = True
                alert["resolved_at"] = datetime.now(timezone.utc).isoformat()
                return True
        return False
    
    def export_logs(
        self,
        format_type: str = "json",
        filters: Optional[Dict[str, Any]] = None
    ) -> str:
        """Export logs in various formats"""
        logs = self.search_logs(filters or {})
        
        if format_type == "json":
            return json.dumps(logs, indent=2, default=str)
        elif format_type == "csv":
            if not logs:
                return "timestamp,level,service,message,request_id\n"
            
            csv_lines = ["timestamp,level,service,message,request_id"]
            for log in logs:
                line = f"{log.get('timestamp', '')},{log.get('level', '')},{log.get('service', '')},{log.get('message', '').replace(',', ';')},{log.get('request_id', '')}"
                csv_lines.append(line)
            return "\n".join(csv_lines)
        elif format_type == "txt":
            lines = []
            for log in logs:
                line = f"[{log.get('timestamp', '')}] {log.get('level', '')} {log.get('service', '')} - {log.get('message', '')}"
                if log.get('request_id'):
                    line += f" (Request: {log['request_id']})"
                lines.append(line)
            return "\n".join(lines)
        else:
            raise ValueError(f"Unsupported format: {format_type}")
    
    def get_service_stats(self) -> Dict[str, Any]:
        """Get service statistics"""
        return {
            "total_logs": len(self._log_buffer),
            "total_errors": sum(self._error_counts.values()),
            "total_requests": len(self._request_metrics),
            "active_alerts": len(self.get_active_alerts()),
            "buffer_size": len(self._log_buffer),
            "metrics_size": len(self._request_metrics),
            "error_types": len(self._error_counts),
            "uptime_seconds": time.time() - getattr(self, '_start_time', time.time())
        }


# Global logger instance
logger = StructuredLogger()