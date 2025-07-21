/**
 * Ellie Voice Receptionist Backend Server
 * Requirements: 5.4, 5.5
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { ErrorHandler } from './utils/errorHandler';
import { ERROR_CODES } from './types/errors';
import { WebSocketHandler } from './services/websocketHandler';
import { logger } from './services/loggerService';
import { rateLimitService } from './services/rateLimitService';
import { fallbackService } from './services/fallbackService';
import voiceRoutes from './routes/voice';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// Enhanced rate limiting with queue system
app.use(rateLimitService.createApiRateLimiter());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced request logging middleware
app.use((req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;
  
  const startTime = Date.now();
  const { method, url, ip } = req;
  
  // Log request start
  logger.info(`Incoming request: ${method} ${url}`, {
    requestId,
    method,
    url,
    service: 'api',
    metadata: {
      ip,
      userAgent: req.get('User-Agent'),
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length')
    }
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    
    logger.logRequest(method, url, statusCode, duration, requestId);
  });
  
  // Log errors
  res.on('error', (error) => {
    logger.error(`Response error: ${method} ${url}`, {
      requestId,
      method,
      url,
      service: 'api',
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  });
  
  next();
});

// Initialize WebSocket handler
const websocketHandler = new WebSocketHandler(io);

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const connectionStats = websocketHandler.getConnectionStats();
  const serviceHealth = fallbackService.getServiceHealth();
  const rateLimitStats = rateLimitService.getStats();
  const errorStats = logger.getErrorStats();
  
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'N/A', // Will be implemented later if needed
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
      groq: process.env.GROQ_API_KEY ? 'configured' : 'not configured',
      websocket: 'active'
    },
    connections: connectionStats,
    serviceHealth,
    rateLimiting: rateLimitStats,
    errors: errorStats,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    }
  };
  
  logger.debug('Health check requested', {
    requestId: req.requestId,
    service: 'health-check'
  });
  
  res.status(200).json(healthCheck);
});

// Monitoring endpoints
app.get('/api/monitoring/logs', (req, res) => {
  const count = parseInt(req.query.count as string) || 100;
  const level = req.query.level as string;
  
  const logs = logger.getRecentLogs(count, level as any);
  
  logger.info('Logs requested', {
    requestId: req.requestId,
    service: 'monitoring',
    metadata: { count, level }
  });
  
  res.json({ logs, total: logs.length });
});

app.get('/api/monitoring/errors', (req, res) => {
  const timeWindow = parseInt(req.query.window as string) || 3600000; // 1 hour default
  const errorStats = logger.getErrorStats(timeWindow);
  
  logger.info('Error stats requested', {
    requestId: req.requestId,
    service: 'monitoring',
    metadata: { timeWindow }
  });
  
  res.json(errorStats);
});

app.get('/api/monitoring/fallbacks', (req, res) => {
  const fallbackStats = fallbackService.getFallbackStats();
  
  logger.info('Fallback stats requested', {
    requestId: req.requestId,
    service: 'monitoring'
  });
  
  res.json(fallbackStats);
});

// Voice processing routes
app.use('/api/voice', voiceRoutes);

// API routes placeholder
app.get('/api', (req, res) => {
  res.json({
    message: 'Ellie Voice Receptionist API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      voice: '/api/voice/*',
      websocket: '/socket.io'
    }
  });
});

// Enhanced global error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Log error with structured logging
  logger.error(`Unhandled error: ${error.message}`, {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    service: 'error-handler',
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    metadata: {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      errorType: error.type
    }
  });
  
  // Handle specific error types
  if (error.type === 'entity.too.large') {
    const errorResponse = ErrorHandler.createErrorResponse(
      ERROR_CODES.AUDIO_TOO_LARGE,
      ErrorHandler.formatUserMessage(ERROR_CODES.AUDIO_TOO_LARGE),
      undefined,
      req.requestId
    );
    return res.status(413).json(errorResponse);
  }
  
  if (error.type === 'entity.parse.failed') {
    const errorResponse = ErrorHandler.createErrorResponse(
      ERROR_CODES.INVALID_INPUT,
      ErrorHandler.formatUserMessage(ERROR_CODES.INVALID_INPUT),
      undefined,
      req.requestId
    );
    return res.status(400).json(errorResponse);
  }

  // Handle rate limiting errors
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    const errorResponse = ErrorHandler.createErrorResponse(
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      ErrorHandler.formatUserMessage(ERROR_CODES.RATE_LIMIT_EXCEEDED),
      error.details,
      req.requestId
    );
    return res.status(429).json(errorResponse);
  }

  // Handle timeout errors
  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
    const errorResponse = ErrorHandler.createErrorResponse(
      ERROR_CODES.CONNECTION_TIMEOUT,
      ErrorHandler.formatUserMessage(ERROR_CODES.CONNECTION_TIMEOUT),
      undefined,
      req.requestId
    );
    return res.status(408).json(errorResponse);
  }
  
  // Default server error with fallback response
  const fallbackResponse = fallbackService.getContextualFallback('error', req.requestId!, error.message);
  
  const errorResponse = ErrorHandler.createErrorResponse(
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    fallbackResponse.text,
    {
      isFallback: fallbackResponse.isFallback,
      fallbackReason: fallbackResponse.fallbackReason,
      originalError: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    req.requestId
  );
  
  return res.status(500).json(errorResponse);
});

// 404 handler
app.use('*', (req, res) => {
  const errorResponse = ErrorHandler.createErrorResponse(
    ERROR_CODES.INVALID_INPUT,
    `Endpoint ${req.method} ${req.originalUrl} not found`,
    undefined,
    req.requestId
  );
  res.status(404).json(errorResponse);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Ellie Voice Receptionist Backend running on port ${PORT}`);
  console.log(`[${new Date().toISOString()}] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[${new Date().toISOString()}] Health check available at: http://localhost:${PORT}/health`);
});

export { app, server, io };