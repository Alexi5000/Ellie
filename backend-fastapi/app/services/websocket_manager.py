"""
WebSocket Manager
Real-time communication management for voice interactions
"""

import asyncio
import json
import time
from typing import Any, Dict, List, Optional, Set
from uuid import uuid4

from fastapi import WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import WebSocketError


class ConnectionInfo(BaseModel):
    """WebSocket connection information"""
    connection_id: str
    client_ip: str
    user_agent: str
    connected_at: float
    last_activity: float
    message_count: int = 0
    user_id: Optional[str] = None
    session_id: Optional[str] = None


class WebSocketMessage(BaseModel):
    """WebSocket message structure"""
    type: str
    data: Dict[str, Any]
    timestamp: float
    connection_id: str
    message_id: str = ""
    
    def __init__(self, **data):
        if not data.get("message_id"):
            data["message_id"] = str(uuid4())
        if not data.get("timestamp"):
            data["timestamp"] = time.time()
        super().__init__(**data)


class WebSocketManager:
    """Manages WebSocket connections and real-time communication"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.connection_info: Dict[str, ConnectionInfo] = {}
        self.user_connections: Dict[str, Set[str]] = {}  # user_id -> connection_ids
        self.session_connections: Dict[str, Set[str]] = {}  # session_id -> connection_ids
        self.message_handlers: Dict[str, callable] = {}
        self.heartbeat_task: Optional[asyncio.Task] = None
        self.cleanup_task: Optional[asyncio.Task] = None
        self.running = False
        
        # Statistics
        self.stats = {
            "total_connections": 0,
            "current_connections": 0,
            "messages_sent": 0,
            "messages_received": 0,
            "disconnections": 0,
            "errors": 0
        }
    
    async def initialize(self) -> None:
        """Initialize WebSocket manager"""
        logger.info("Initializing WebSocket manager", service="websocket")
        
        self.running = True
        
        # Start background tasks
        if settings.WEBSOCKET_ENABLED:
            self.heartbeat_task = asyncio.create_task(self._heartbeat_loop())
            self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        
        # Register default message handlers
        self.register_handler("ping", self._handle_ping)
        self.register_handler("voice_input", self._handle_voice_input)
        self.register_handler("text_input", self._handle_text_input)
        
        logger.info("WebSocket manager initialized", service="websocket")
    
    async def shutdown(self) -> None:
        """Shutdown WebSocket manager"""
        logger.info("Shutting down WebSocket manager", service="websocket")
        
        self.running = False
        
        # Cancel background tasks
        if self.heartbeat_task:
            self.heartbeat_task.cancel()
        if self.cleanup_task:
            self.cleanup_task.cancel()
        
        # Close all connections
        for connection_id in list(self.active_connections.keys()):
            await self.disconnect(connection_id)
        
        logger.info("WebSocket manager shut down", service="websocket")
    
    async def handle_connection(self, websocket: WebSocket) -> None:
        """Handle new WebSocket connection"""
        connection_id = str(uuid4())
        
        try:
            await websocket.accept()
            
            # Store connection
            self.active_connections[connection_id] = websocket
            
            # Create connection info
            client_ip = websocket.client.host if websocket.client else "unknown"
            user_agent = websocket.headers.get("user-agent", "unknown")
            
            self.connection_info[connection_id] = ConnectionInfo(
                connection_id=connection_id,
                client_ip=client_ip,
                user_agent=user_agent,
                connected_at=time.time(),
                last_activity=time.time()
            )
            
            # Update stats
            self.stats["total_connections"] += 1
            self.stats["current_connections"] = len(self.active_connections)
            
            logger.info(
                f"WebSocket connection established: {connection_id}",
                service="websocket",
                metadata={
                    "connection_id": connection_id,
                    "client_ip": client_ip,
                    "user_agent": user_agent,
                    "total_connections": self.stats["current_connections"]
                }
            )
            
            # Send welcome message
            await self.send_message(connection_id, {
                "type": "connection_established",
                "data": {
                    "connection_id": connection_id,
                    "server_time": time.time(),
                    "features": ["voice_input", "text_input", "real_time_responses"]
                }
            })
            
            # Handle messages
            await self._handle_messages(connection_id, websocket)
            
        except WebSocketDisconnect:
            await self.disconnect(connection_id)
        except Exception as e:
            logger.error(
                f"WebSocket connection error: {str(e)}",
                service="websocket",
                error={"message": str(e), "type": type(e).__name__},
                metadata={"connection_id": connection_id}
            )
            await self.disconnect(connection_id)
    
    async def _handle_messages(self, connection_id: str, websocket: WebSocket) -> None:
        """Handle incoming messages from WebSocket"""
        try:
            while self.running:
                # Receive message
                data = await websocket.receive_text()
                
                try:
                    message_data = json.loads(data)
                    message = WebSocketMessage(
                        connection_id=connection_id,
                        **message_data
                    )
                    
                    # Update connection activity
                    if connection_id in self.connection_info:
                        self.connection_info[connection_id].last_activity = time.time()
                        self.connection_info[connection_id].message_count += 1
                    
                    self.stats["messages_received"] += 1
                    
                    logger.debug(
                        f"WebSocket message received: {message.type}",
                        service="websocket",
                        metadata={
                            "connection_id": connection_id,
                            "message_type": message.type,
                            "message_id": message.message_id
                        }
                    )
                    
                    # Handle message
                    await self._process_message(message)
                    
                except json.JSONDecodeError as e:
                    logger.warning(
                        f"Invalid JSON received from WebSocket: {str(e)}",
                        service="websocket",
                        metadata={"connection_id": connection_id, "data": data[:100]}
                    )
                    
                    await self.send_error(connection_id, "Invalid JSON format")
                
                except Exception as e:
                    logger.error(
                        f"Error processing WebSocket message: {str(e)}",
                        service="websocket",
                        error={"message": str(e), "type": type(e).__name__},
                        metadata={"connection_id": connection_id}
                    )
                    
                    await self.send_error(connection_id, "Message processing error")
        
        except WebSocketDisconnect:
            pass  # Normal disconnection
        except Exception as e:
            logger.error(
                f"WebSocket message handling error: {str(e)}",
                service="websocket",
                error={"message": str(e), "type": type(e).__name__},
                metadata={"connection_id": connection_id}
            )
    
    async def _process_message(self, message: WebSocketMessage) -> None:
        """Process incoming WebSocket message"""
        handler = self.message_handlers.get(message.type)
        
        if handler:
            try:
                await handler(message)
            except Exception as e:
                logger.error(
                    f"Message handler error: {str(e)}",
                    service="websocket",
                    error={"message": str(e), "type": type(e).__name__},
                    metadata={
                        "connection_id": message.connection_id,
                        "message_type": message.type,
                        "handler": handler.__name__
                    }
                )
                
                await self.send_error(
                    message.connection_id,
                    f"Error processing {message.type} message"
                )
        else:
            logger.warning(
                f"No handler for message type: {message.type}",
                service="websocket",
                metadata={
                    "connection_id": message.connection_id,
                    "message_type": message.type
                }
            )
            
            await self.send_error(
                message.connection_id,
                f"Unknown message type: {message.type}"
            )
    
    async def send_message(
        self,
        connection_id: str,
        message: Dict[str, Any],
        message_type: Optional[str] = None
    ) -> bool:
        """Send message to specific connection"""
        if connection_id not in self.active_connections:
            return False
        
        try:
            websocket = self.active_connections[connection_id]
            
            # Ensure message has required fields
            if "type" not in message:
                message["type"] = message_type or "message"
            if "timestamp" not in message:
                message["timestamp"] = time.time()
            if "message_id" not in message:
                message["message_id"] = str(uuid4())
            
            await websocket.send_text(json.dumps(message, default=str))
            
            self.stats["messages_sent"] += 1
            
            logger.debug(
                f"WebSocket message sent: {message.get('type')}",
                service="websocket",
                metadata={
                    "connection_id": connection_id,
                    "message_type": message.get("type"),
                    "message_id": message.get("message_id")
                }
            )
            
            return True
            
        except Exception as e:
            logger.error(
                f"Failed to send WebSocket message: {str(e)}",
                service="websocket",
                error={"message": str(e), "type": type(e).__name__},
                metadata={"connection_id": connection_id}
            )
            
            # Remove broken connection
            await self.disconnect(connection_id)
            return False
    
    async def send_error(self, connection_id: str, error_message: str) -> bool:
        """Send error message to connection"""
        return await self.send_message(connection_id, {
            "type": "error",
            "data": {
                "error": error_message,
                "timestamp": time.time()
            }
        })
    
    async def broadcast_message(
        self,
        message: Dict[str, Any],
        exclude_connections: Optional[Set[str]] = None
    ) -> int:
        """Broadcast message to all connections"""
        exclude_connections = exclude_connections or set()
        sent_count = 0
        
        for connection_id in list(self.active_connections.keys()):
            if connection_id not in exclude_connections:
                if await self.send_message(connection_id, message):
                    sent_count += 1
        
        logger.debug(
            f"Broadcast message sent to {sent_count} connections",
            service="websocket",
            metadata={
                "message_type": message.get("type"),
                "sent_count": sent_count,
                "total_connections": len(self.active_connections)
            }
        )
        
        return sent_count
    
    async def disconnect(self, connection_id: str) -> None:
        """Disconnect WebSocket connection"""
        if connection_id in self.active_connections:
            try:
                websocket = self.active_connections[connection_id]
                await websocket.close()
            except Exception as e:
                logger.warning(
                    f"Error closing WebSocket: {str(e)}",
                    service="websocket",
                    error={"message": str(e), "type": type(e).__name__}
                )
            
            del self.active_connections[connection_id]
        
        # Clean up connection info
        if connection_id in self.connection_info:
            conn_info = self.connection_info[connection_id]
            
            # Remove from user connections
            if conn_info.user_id and conn_info.user_id in self.user_connections:
                self.user_connections[conn_info.user_id].discard(connection_id)
                if not self.user_connections[conn_info.user_id]:
                    del self.user_connections[conn_info.user_id]
            
            # Remove from session connections
            if conn_info.session_id and conn_info.session_id in self.session_connections:
                self.session_connections[conn_info.session_id].discard(connection_id)
                if not self.session_connections[conn_info.session_id]:
                    del self.session_connections[conn_info.session_id]
            
            del self.connection_info[connection_id]
        
        # Update stats
        self.stats["disconnections"] += 1
        self.stats["current_connections"] = len(self.active_connections)
        
        logger.info(
            f"WebSocket connection closed: {connection_id}",
            service="websocket",
            metadata={
                "connection_id": connection_id,
                "remaining_connections": self.stats["current_connections"]
            }
        )
    
    def register_handler(self, message_type: str, handler: callable) -> None:
        """Register message handler"""
        self.message_handlers[message_type] = handler
        
        logger.debug(
            f"Registered WebSocket handler: {message_type}",
            service="websocket",
            metadata={"message_type": message_type, "handler": handler.__name__}
        )
    
    async def _handle_ping(self, message: WebSocketMessage) -> None:
        """Handle ping message"""
        await self.send_message(message.connection_id, {
            "type": "pong",
            "data": {
                "timestamp": time.time(),
                "original_timestamp": message.data.get("timestamp")
            }
        })
    
    async def _handle_voice_input(self, message: WebSocketMessage) -> None:
        """Handle voice input message"""
        # This would integrate with voice processing service
        await self.send_message(message.connection_id, {
            "type": "voice_processing",
            "data": {
                "status": "processing",
                "message": "Processing your voice input..."
            }
        })
        
        # TODO: Integrate with actual voice processing
        # For now, send a mock response
        await asyncio.sleep(1)  # Simulate processing time
        
        await self.send_message(message.connection_id, {
            "type": "ai_response",
            "data": {
                "text": "I received your voice input. This is a mock response.",
                "audio_url": None,  # Would contain TTS audio URL
                "processing_time_ms": 1000
            }
        })
    
    async def _handle_text_input(self, message: WebSocketMessage) -> None:
        """Handle text input message"""
        text = message.data.get("text", "")
        
        if not text:
            await self.send_error(message.connection_id, "Text input is required")
            return
        
        await self.send_message(message.connection_id, {
            "type": "text_processing",
            "data": {
                "status": "processing",
                "message": "Processing your message..."
            }
        })
        
        # TODO: Integrate with AI service
        # For now, send a mock response
        await asyncio.sleep(0.5)  # Simulate processing time
        
        await self.send_message(message.connection_id, {
            "type": "ai_response",
            "data": {
                "text": f"I received your message: '{text}'. This is a mock response.",
                "audio_url": None,  # Would contain TTS audio URL
                "processing_time_ms": 500
            }
        })
    
    async def _heartbeat_loop(self) -> None:
        """Send heartbeat to all connections"""
        while self.running:
            try:
                if self.active_connections:
                    await self.broadcast_message({
                        "type": "heartbeat",
                        "data": {
                            "timestamp": time.time(),
                            "server_status": "healthy"
                        }
                    })
                
                await asyncio.sleep(settings.WEBSOCKET_HEARTBEAT_INTERVAL)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(
                    f"Heartbeat loop error: {str(e)}",
                    service="websocket",
                    error={"message": str(e), "type": type(e).__name__}
                )
                await asyncio.sleep(5)
    
    async def _cleanup_loop(self) -> None:
        """Clean up inactive connections"""
        while self.running:
            try:
                current_time = time.time()
                inactive_connections = []
                
                for connection_id, conn_info in self.connection_info.items():
                    # Check for inactive connections (no activity for 5 minutes)
                    if current_time - conn_info.last_activity > 300:
                        inactive_connections.append(connection_id)
                
                # Disconnect inactive connections
                for connection_id in inactive_connections:
                    logger.info(
                        f"Disconnecting inactive WebSocket: {connection_id}",
                        service="websocket",
                        metadata={"connection_id": connection_id}
                    )
                    await self.disconnect(connection_id)
                
                await asyncio.sleep(60)  # Check every minute
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(
                    f"Cleanup loop error: {str(e)}",
                    service="websocket",
                    error={"message": str(e), "type": type(e).__name__}
                )
                await asyncio.sleep(10)
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get WebSocket connection statistics"""
        return {
            **self.stats,
            "active_connections": len(self.active_connections),
            "connection_details": [
                {
                    "connection_id": conn_info.connection_id,
                    "client_ip": conn_info.client_ip,
                    "connected_at": conn_info.connected_at,
                    "last_activity": conn_info.last_activity,
                    "message_count": conn_info.message_count,
                    "user_id": conn_info.user_id,
                    "session_id": conn_info.session_id
                }
                for conn_info in self.connection_info.values()
            ]
        }


# Global WebSocket manager instance
websocket_manager = WebSocketManager()