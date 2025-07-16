"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const uuid_1 = require("uuid");
const errorHandler_1 = require("./utils/errorHandler");
const errors_1 = require("./types/errors");
const websocketHandler_1 = require("./services/websocketHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
exports.io = io;
const PORT = process.env.PORT || 5000;
app.use((0, helmet_1.default)({
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
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: errorHandler_1.ErrorHandler.createErrorResponse(errors_1.ERROR_CODES.RATE_LIMIT_EXCEEDED, errorHandler_1.ErrorHandler.formatUserMessage(errors_1.ERROR_CODES.RATE_LIMIT_EXCEEDED)),
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
    const requestId = (0, uuid_1.v4)();
    req.requestId = requestId;
    const startTime = Date.now();
    const { method, url, ip } = req;
    console.log(`[${new Date().toISOString()}] ${requestId} - ${method} ${url} - IP: ${ip}`);
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const { statusCode } = res;
        console.log(`[${new Date().toISOString()}] ${requestId} - ${method} ${url} - ${statusCode} - ${duration}ms`);
    });
    next();
});
const websocketHandler = new websocketHandler_1.WebSocketHandler(io);
app.get('/health', (req, res) => {
    const connectionStats = websocketHandler.getConnectionStats();
    const healthCheck = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        services: {
            database: 'N/A',
            openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
            groq: process.env.GROQ_API_KEY ? 'configured' : 'not configured',
            websocket: 'active'
        },
        connections: connectionStats
    };
    res.status(200).json(healthCheck);
});
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
app.use((error, req, res, next) => {
    console.error(`[${new Date().toISOString()}] ${req.requestId} - Error:`, error);
    if (error.type === 'entity.too.large') {
        const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(errors_1.ERROR_CODES.AUDIO_TOO_LARGE, errorHandler_1.ErrorHandler.formatUserMessage(errors_1.ERROR_CODES.AUDIO_TOO_LARGE), undefined, req.requestId);
        return res.status(413).json(errorResponse);
    }
    if (error.type === 'entity.parse.failed') {
        const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(errors_1.ERROR_CODES.INVALID_INPUT, errorHandler_1.ErrorHandler.formatUserMessage(errors_1.ERROR_CODES.INVALID_INPUT), undefined, req.requestId);
        return res.status(400).json(errorResponse);
    }
    const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(errors_1.ERROR_CODES.INTERNAL_SERVER_ERROR, errorHandler_1.ErrorHandler.formatUserMessage(errors_1.ERROR_CODES.INTERNAL_SERVER_ERROR), process.env.NODE_ENV === 'development' ? error.stack : undefined, req.requestId);
    return res.status(500).json(errorResponse);
});
app.use('*', (req, res) => {
    const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(errors_1.ERROR_CODES.INVALID_INPUT, `Endpoint ${req.method} ${req.originalUrl} not found`, undefined, req.requestId);
    res.status(404).json(errorResponse);
});
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
server.listen(PORT, () => {
    console.log(`[${new Date().toISOString()}] Ellie Voice Receptionist Backend running on port ${PORT}`);
    console.log(`[${new Date().toISOString()}] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[${new Date().toISOString()}] Health check available at: http://localhost:${PORT}/health`);
});
//# sourceMappingURL=index.js.map