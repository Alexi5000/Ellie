"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const testEnvPath = path_1.default.resolve(__dirname, '../../../.env.test');
dotenv_1.default.config({ path: testEnvPath });
process.env.NODE_ENV = 'test';
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    process.env.OPENAI_API_KEY = 'test_openai_api_key_mock';
}
if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    process.env.GROQ_API_KEY = 'test_groq_api_key_mock';
}
process.env.PORT = process.env.PORT || '0';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';
process.env.REDIS_DB = process.env.REDIS_DB || '1';
process.env.CDN_ENABLED = 'false';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.MAX_AUDIO_FILE_SIZE = process.env.MAX_AUDIO_FILE_SIZE || '10485760';
process.env.ALLOWED_AUDIO_FORMATS = process.env.ALLOWED_AUDIO_FORMATS || 'audio/wav,audio/mp3,audio/m4a,audio/webm';
process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || '60000';
process.env.RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || '1000';
process.env.SESSION_TIMEOUT_MS = process.env.SESSION_TIMEOUT_MS || '1800000';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_NAME = process.env.DB_NAME || 'ellie_test_db';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.DB_SSL = process.env.DB_SSL || 'false';
process.env.DB_POOL_SIZE = process.env.DB_POOL_SIZE || '5';
process.env.DB_CONNECTION_TIMEOUT = process.env.DB_CONNECTION_TIMEOUT || '10000';
process.env.DB_IDLE_TIMEOUT = process.env.DB_IDLE_TIMEOUT || '60000';
console.log('Test environment setup completed:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '[SET]' : '[NOT SET]',
    GROQ_API_KEY: process.env.GROQ_API_KEY ? '[SET]' : '[NOT SET]',
    LOG_LEVEL: process.env.LOG_LEVEL,
    REDIS_DB: process.env.REDIS_DB
});
//# sourceMappingURL=env-setup.js.map