/**
 * Ellie Voice Receptionist Backend Server
 * Requirements: 5.4, 5.5
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { ErrorHandler } from './utils/errorHandler';
import { ERROR_CODES } from './types/errors';
import { WebSocketHandler } from './services/websocketHandler';
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: ErrorHandler.createErrorResponse(
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    ErrorHandler.formatUserMessage(ERROR_CODES.RATE_LIMIT_EXCEEDED)
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;
  
  const startTime = Date.now();
  const { method, url, ip } = req;
  
  console.log(`[${new Date().toISOString()}] ${requestId} - ${method} ${url} - IP: ${ip}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    console.log(`[${new Date().toISOString()}] ${requestId} - ${method} ${url} - ${statusCode} - ${duration}ms`);
  });
  
  next();
});

// Initialize WebSocket handler
const websocketHandler = new WebSocketHandler(io);

// Health check endpoint
app.get('/health', (req, res) => {
  const connectionStats = websocketHandler.getConnectionStats();
  
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
    connections: connectionStats
  };
  
  res.status(200).json(healthCheck);
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

// Global error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[${new Date().toISOString()}] ${req.requestId} - Error:`, error);
  
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
  
  // Default server error
  const errorResponse = ErrorHandler.createErrorResponse(
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    ErrorHandler.formatUserMessage(ERROR_CODES.INTERNAL_SERVER_ERROR),
    process.env.NODE_ENV === 'development' ? error.stack : undefined,
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