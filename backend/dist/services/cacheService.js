"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
const redis_1 = require("redis");
const loggerService_1 = require("./loggerService");
const zlib_1 = require("zlib");
const util_1 = require("util");
class CacheService {
    constructor() {
        this.isConnected = false;
        this.stats = {
            hits: 0,
            misses: 0,
            hitRate: 0,
            totalKeys: 0,
            memoryUsage: '0MB'
        };
        this.AI_RESPONSE_PREFIX = 'ai_response:';
        this.TTS_AUDIO_PREFIX = 'tts_audio:';
        this.USER_SESSION_PREFIX = 'user_session:';
        this.DEFAULT_TTL = {
            AI_RESPONSE: 3600,
            TTS_AUDIO: 7200,
            USER_SESSION: 1800,
        };
        if (process.env.NODE_ENV !== 'test') {
            this.initializeConnection();
        }
    }
    async initializeConnection() {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            this.client = (0, redis_1.createClient)({
                url: redisUrl,
                socket: {
                    connectTimeout: 5000,
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            loggerService_1.logger.error('Redis reconnection failed after 10 attempts', {
                                service: 'cache',
                                metadata: { retries }
                            });
                            return false;
                        }
                        return Math.min(retries * 100, 3000);
                    }
                }
            });
            this.client.on('connect', () => {
                loggerService_1.logger.info('Redis connecting...', { service: 'cache' });
            });
            this.client.on('ready', () => {
                this.isConnected = true;
                loggerService_1.logger.info('Redis connected successfully', { service: 'cache' });
            });
            this.client.on('error', (error) => {
                this.isConnected = false;
                loggerService_1.logger.error('Redis connection error', {
                    service: 'cache',
                    error: {
                        message: error.message,
                        stack: error.stack
                    }
                });
            });
            this.client.on('end', () => {
                this.isConnected = false;
                loggerService_1.logger.info('Redis connection ended', { service: 'cache' });
            });
            await this.client.connect();
        }
        catch (error) {
            this.isConnected = false;
            loggerService_1.logger.error('Failed to initialize Redis connection', {
                service: 'cache',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined
                }
            });
        }
    }
    isAvailable() {
        return this.isConnected;
    }
    async cacheAIResponse(userInput, context, response, options = {}) {
        if (!this.isAvailable()) {
            loggerService_1.logger.warn('Cache not available for AI response caching');
            return false;
        }
        try {
            const contextWithLanguage = {
                ...context,
                language: context.language || 'en'
            };
            const cacheKey = this.generateAIResponseKey(userInput, contextWithLanguage);
            const ttl = options.ttl || this.DEFAULT_TTL.AI_RESPONSE;
            const cacheData = {
                response,
                timestamp: Date.now(),
                userInput: userInput.substring(0, 100),
                contextHash: this.hashObject(contextWithLanguage),
                language: options.language || context.language || 'en'
            };
            const serializedData = JSON.stringify(cacheData);
            const finalData = options.compress ? await this.compress(serializedData) : serializedData;
            await this.client.setEx(cacheKey, ttl, finalData);
            loggerService_1.logger.debug('AI response cached successfully', {
                service: 'cache',
                metadata: {
                    cacheKey: cacheKey.substring(0, 50) + '...',
                    ttl,
                    dataSize: finalData.length,
                    language: cacheData.language
                }
            });
            return true;
        }
        catch (error) {
            loggerService_1.logger.error('Failed to cache AI response', {
                service: 'cache',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            return false;
        }
    }
    async getCachedAIResponse(userInput, context) {
        if (!this.isAvailable()) {
            return null;
        }
        try {
            const contextWithLanguage = {
                ...context,
                language: context.language || 'en'
            };
            const cacheKey = this.generateAIResponseKey(userInput, contextWithLanguage);
            const cachedData = await this.client.get(cacheKey);
            if (!cachedData) {
                this.stats.misses++;
                return null;
            }
            const decompressedData = await this.decompress(cachedData);
            const parsedData = JSON.parse(decompressedData);
            if (!parsedData.response || !parsedData.timestamp) {
                loggerService_1.logger.warn('Invalid cached AI response data', {
                    service: 'cache',
                    metadata: {
                        cacheKey: cacheKey.substring(0, 50) + '...'
                    }
                });
                await this.client.del(cacheKey);
                this.stats.misses++;
                return null;
            }
            this.stats.hits++;
            this.updateHitRate();
            loggerService_1.logger.debug('AI response cache hit', {
                service: 'cache',
                metadata: {
                    cacheKey: cacheKey.substring(0, 50) + '...',
                    timestamp: parsedData.timestamp,
                    language: parsedData.language || 'en'
                }
            });
            return parsedData.response;
        }
        catch (error) {
            loggerService_1.logger.error('Failed to retrieve cached AI response', {
                service: 'cache',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            this.stats.misses++;
            return null;
        }
    }
    async cacheTTSAudio(text, voice, speed, audioBuffer, options = {}) {
        if (!this.isAvailable()) {
            loggerService_1.logger.warn('Cache not available for TTS audio caching');
            return false;
        }
        try {
            const language = options.language || 'default';
            const cacheKey = this.generateTTSKey(text, voice, speed, language);
            const ttl = options.ttl || this.DEFAULT_TTL.TTS_AUDIO;
            const cacheData = {
                audioBuffer: audioBuffer.toString('base64'),
                timestamp: Date.now(),
                text: text.substring(0, 100),
                voice,
                speed,
                language,
                bufferLength: audioBuffer.length
            };
            const serializedData = JSON.stringify(cacheData);
            const finalData = options.compress ? await this.compress(serializedData) : serializedData;
            await this.client.setEx(cacheKey, ttl, finalData);
            loggerService_1.logger.debug('TTS audio cached successfully', {
                service: 'cache',
                metadata: {
                    cacheKey: cacheKey.substring(0, 50) + '...',
                    ttl,
                    bufferLength: audioBuffer.length,
                    voice,
                    speed,
                    language
                }
            });
            return true;
        }
        catch (error) {
            loggerService_1.logger.error('Failed to cache TTS audio', {
                service: 'cache',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            return false;
        }
    }
    async getCachedTTSAudio(text, voice, speed, language) {
        if (!this.isAvailable()) {
            return null;
        }
        try {
            const cacheKey = this.generateTTSKey(text, voice, speed, language || 'default');
            const cachedData = await this.client.get(cacheKey);
            if (!cachedData) {
                this.stats.misses++;
                return null;
            }
            const decompressedData = await this.decompress(cachedData);
            const parsedData = JSON.parse(decompressedData);
            if (!parsedData.audioBuffer || !parsedData.timestamp) {
                loggerService_1.logger.warn('Invalid cached TTS audio data', {
                    service: 'cache',
                    metadata: {
                        cacheKey: cacheKey.substring(0, 50) + '...'
                    }
                });
                await this.client.del(cacheKey);
                this.stats.misses++;
                return null;
            }
            this.stats.hits++;
            this.updateHitRate();
            const audioBuffer = Buffer.from(parsedData.audioBuffer, 'base64');
            loggerService_1.logger.debug('TTS audio cache hit', {
                service: 'cache',
                metadata: {
                    cacheKey: cacheKey.substring(0, 50) + '...',
                    timestamp: parsedData.timestamp,
                    bufferLength: audioBuffer.length,
                    language: parsedData.language || 'default'
                }
            });
            return audioBuffer;
        }
        catch (error) {
            loggerService_1.logger.error('Failed to retrieve cached TTS audio', {
                service: 'cache',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            this.stats.misses++;
            return null;
        }
    }
    async cacheUserSession(sessionId, sessionData, options = {}) {
        if (!this.isAvailable()) {
            return false;
        }
        try {
            const cacheKey = `${this.USER_SESSION_PREFIX}${sessionId}`;
            const ttl = options.ttl || this.DEFAULT_TTL.USER_SESSION;
            const cacheData = JSON.stringify({
                ...sessionData,
                timestamp: Date.now(),
                language: sessionData.language || 'en'
            });
            await this.client.setEx(cacheKey, ttl, cacheData);
            return true;
        }
        catch (error) {
            loggerService_1.logger.error('Failed to cache user session', {
                service: 'cache',
                metadata: { sessionId },
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            return false;
        }
    }
    async getCachedUserSession(sessionId) {
        if (!this.isAvailable()) {
            return null;
        }
        try {
            const cacheKey = `${this.USER_SESSION_PREFIX}${sessionId}`;
            const cachedData = await this.client.get(cacheKey);
            if (!cachedData) {
                return null;
            }
            return JSON.parse(cachedData);
        }
        catch (error) {
            loggerService_1.logger.error('Failed to retrieve cached user session', {
                service: 'cache',
                metadata: { sessionId },
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            return null;
        }
    }
    async invalidateByPattern(pattern) {
        if (!this.isAvailable()) {
            return 0;
        }
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length === 0) {
                return 0;
            }
            await this.client.del(keys);
            loggerService_1.logger.info('Cache invalidated by pattern', {
                service: 'cache',
                metadata: {
                    pattern,
                    keysDeleted: keys.length
                }
            });
            return keys.length;
        }
        catch (error) {
            loggerService_1.logger.error('Failed to invalidate cache by pattern', {
                service: 'cache',
                metadata: {
                    pattern
                },
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            return 0;
        }
    }
    async getCacheStats() {
        if (!this.isAvailable()) {
            return this.stats;
        }
        try {
            const info = await this.client.info('memory');
            const keyCount = await this.client.dbSize();
            const memoryMatch = info.match(/used_memory_human:(.+)/);
            const memoryUsage = memoryMatch ? memoryMatch[1].trim() : '0B';
            this.stats.totalKeys = keyCount;
            this.stats.memoryUsage = memoryUsage;
            return this.stats;
        }
        catch (error) {
            loggerService_1.logger.error('Failed to get cache stats', {
                service: 'cache',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            return this.stats;
        }
    }
    async clearCache() {
        if (!this.isAvailable()) {
            return false;
        }
        try {
            await this.client.flushDb();
            this.stats = {
                hits: 0,
                misses: 0,
                hitRate: 0,
                totalKeys: 0,
                memoryUsage: '0MB'
            };
            loggerService_1.logger.info('Cache cleared successfully', { service: 'cache' });
            return true;
        }
        catch (error) {
            loggerService_1.logger.error('Failed to clear cache', {
                service: 'cache',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            return false;
        }
    }
    generateAIResponseKey(userInput, context) {
        const inputHash = this.hashString(userInput);
        const contextHash = this.hashObject({
            sessionId: context.sessionId,
            conversationHistory: context.conversationHistory,
            legalDisclaimer: context.legalDisclaimer,
            language: context.language || 'en'
        });
        return `${this.AI_RESPONSE_PREFIX}${inputHash}_${contextHash}`;
    }
    generateTTSKey(text, voice, speed, language) {
        const textHash = this.hashString(text);
        return `${this.TTS_AUDIO_PREFIX}${textHash}_${voice}_${speed}_${language}`;
    }
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    hashObject(obj) {
        const str = JSON.stringify(obj, Object.keys(obj).sort());
        return this.hashString(str);
    }
    updateHitRate() {
        const total = this.stats.hits + this.stats.misses;
        this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    }
    async compress(data) {
        try {
            if (data.length < 1000) {
                return data;
            }
            const gzipAsync = (0, util_1.promisify)(zlib_1.gzip);
            const compressed = await gzipAsync(Buffer.from(data));
            return compressed.toString('base64');
        }
        catch (error) {
            loggerService_1.logger.warn('Compression failed, using uncompressed data', {
                service: 'cache',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            return data;
        }
    }
    async decompress(data) {
        try {
            if (!data.startsWith('H4sI') && !data.match(/^[A-Za-z0-9+/=]+$/)) {
                return data;
            }
            const gunzipAsync = (0, util_1.promisify)(zlib_1.gunzip);
            const buffer = Buffer.from(data, 'base64');
            try {
                const decompressed = await gunzipAsync(buffer);
                return decompressed.toString();
            }
            catch {
                return data;
            }
        }
        catch (error) {
            loggerService_1.logger.warn('Decompression failed, using data as-is', {
                service: 'cache',
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            return data;
        }
    }
    async disconnect() {
        if (this.client && this.isConnected) {
            await this.client.disconnect();
            this.isConnected = false;
            loggerService_1.logger.info('Redis connection closed', { service: 'cache' });
        }
    }
}
exports.CacheService = CacheService;
exports.cacheService = new CacheService();
//# sourceMappingURL=cacheService.js.map