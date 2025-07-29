/**
 * Redis Cache Service - Advanced caching strategies for AI responses and TTS audio
 * Requirements: 15.1 - Performance optimization through caching
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from './loggerService';
import { gunzip, gzip } from 'zlib';
import { promisify } from 'util';

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean; // Whether to compress large values
  port?: number; // Redis port (optional, defaults to 6379)
  language?: string; // Language code for language-specific caching
}

export class CacheService {
  private client!: RedisClientType;
  private isConnected: boolean = false;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalKeys: 0,
    memoryUsage: '0MB'
  };

  // Cache key prefixes for different data types
  private readonly AI_RESPONSE_PREFIX = 'ai_response:';
  private readonly TTS_AUDIO_PREFIX = 'tts_audio:';
  private readonly USER_SESSION_PREFIX = 'user_session:';

  // Default TTL values (in seconds)
  private readonly DEFAULT_TTL = {
    AI_RESPONSE: 3600, // 1 hour
    TTS_AUDIO: 7200, // 2 hours
    USER_SESSION: 1800, // 30 minutes
  };

  constructor() {
    this.initializeConnection();
  }

  /**
   * Initialize Redis connection with error handling
   */
  private async initializeConnection(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis reconnection failed after 10 attempts', {
                service: 'cache',
                metadata: { retries }
              });
              return false;
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      // Event handlers
      this.client.on('connect', () => {
        logger.info('Redis connecting...', { service: 'cache' });
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        logger.info('Redis connected successfully', { service: 'cache' });
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        logger.error('Redis connection error', {
          service: 'cache',
          error: {
            message: error.message,
            stack: error.stack
          }
        });
      });

      this.client.on('end', () => {
        this.isConnected = false;
        logger.info('Redis connection ended', { service: 'cache' });
      });

      // Connect to Redis
      await this.client.connect();

    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to initialize Redis connection', {
        service: 'cache',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
    }
  }


  /**
   * Check if Redis is available
   */
  public isAvailable(): boolean {
    return this.isConnected;
  }

  /**
   * Cache AI response with language support
   */
  public async cacheAIResponse(
    userInput: string,
    context: any,
    response: string,
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isAvailable()) {
      logger.warn('Cache not available for AI response caching');
      return false;
    }

    try {
      // Include language in context for language-specific caching
      const contextWithLanguage = {
        ...context,
        language: context.language || 'en'
      };
      
      const cacheKey = this.generateAIResponseKey(userInput, contextWithLanguage);
      const ttl = options.ttl || this.DEFAULT_TTL.AI_RESPONSE;

      const cacheData = {
        response,
        timestamp: Date.now(),
        userInput: userInput.substring(0, 100), // Store truncated input for debugging
        contextHash: this.hashObject(contextWithLanguage),
        language: options.language || context.language || 'en'
      };

      const serializedData = JSON.stringify(cacheData);
      const finalData = options.compress ? await this.compress(serializedData) : serializedData;

      await this.client.setEx(cacheKey, ttl, finalData);

      logger.debug('AI response cached successfully', {
        service: 'cache',
        metadata: {
          cacheKey: cacheKey.substring(0, 50) + '...',
          ttl,
          dataSize: finalData.length,
          language: cacheData.language
        }
      });

      return true;

    } catch (error) {
      logger.error('Failed to cache AI response', {
        service: 'cache',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      return false;
    }
  }

  /**
   * Retrieve cached AI response
   */
  public async getCachedAIResponse(
    userInput: string,
    context: any
  ): Promise<string | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      // Include language in context for language-specific retrieval
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

      // Validate cache data integrity
      if (!parsedData.response || !parsedData.timestamp) {
        logger.warn('Invalid cached AI response data', {
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

      logger.debug('AI response cache hit', {
        service: 'cache',
        metadata: {
          cacheKey: cacheKey.substring(0, 50) + '...',
          timestamp: parsedData.timestamp,
          language: parsedData.language || 'en'
        }
      });

      return parsedData.response;

    } catch (error) {
      logger.error('Failed to retrieve cached AI response', {
        service: 'cache',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Cache TTS audio buffer
   */
  public async cacheTTSAudio(
    text: string,
    voice: string,
    speed: number,
    audioBuffer: Buffer,
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isAvailable()) {
      logger.warn('Cache not available for TTS audio caching');
      return false;
    }

    try {
      const language = options.language || 'default';
      const cacheKey = this.generateTTSKey(text, voice, speed, language);
      const ttl = options.ttl || this.DEFAULT_TTL.TTS_AUDIO;

      const cacheData = {
        audioBuffer: audioBuffer.toString('base64'),
        timestamp: Date.now(),
        text: text.substring(0, 100), // Store truncated text for debugging
        voice,
        speed,
        language,
        bufferLength: audioBuffer.length
      };

      const serializedData = JSON.stringify(cacheData);
      const finalData = options.compress ? await this.compress(serializedData) : serializedData;

      await this.client.setEx(cacheKey, ttl, finalData);

      logger.debug('TTS audio cached successfully', {
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

    } catch (error) {
      logger.error('Failed to cache TTS audio', {
        service: 'cache',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      return false;
    }
  }

  /**
   * Retrieve cached TTS audio
   */
  public async getCachedTTSAudio(
    text: string,
    voice: string,
    speed: number,
    language?: string
  ): Promise<Buffer | null> {
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

      // Validate cache data integrity
      if (!parsedData.audioBuffer || !parsedData.timestamp) {
        logger.warn('Invalid cached TTS audio data', {
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

      logger.debug('TTS audio cache hit', {
        service: 'cache',
        metadata: {
          cacheKey: cacheKey.substring(0, 50) + '...',
          timestamp: parsedData.timestamp,
          bufferLength: audioBuffer.length,
          language: parsedData.language || 'default'
        }
      });

      return audioBuffer;

    } catch (error) {
      logger.error('Failed to retrieve cached TTS audio', {
        service: 'cache',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Cache user session data
   */
  public async cacheUserSession(
    sessionId: string,
    sessionData: any,
    options: CacheOptions = {}
  ): Promise<boolean> {
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

    } catch (error) {
      logger.error('Failed to cache user session', {
        service: 'cache',
        metadata: { sessionId },
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      return false;
    }
  }

  /**
   * Retrieve cached user session
   */
  public async getCachedUserSession(sessionId: string): Promise<any | null> {
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

    } catch (error) {
      logger.error('Failed to retrieve cached user session', {
        service: 'cache',
        metadata: { sessionId },
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      return null;
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  public async invalidateByPattern(pattern: string): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      await this.client.del(keys);

      logger.info('Cache invalidated by pattern', {
        service: 'cache',
        metadata: {
          pattern,
          keysDeleted: keys.length
        }
      });

      return keys.length;

    } catch (error) {
      logger.error('Failed to invalidate cache by pattern', {
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

  /**
   * Get cache statistics
   */
  public async getCacheStats(): Promise<CacheStats> {
    if (!this.isAvailable()) {
      return this.stats;
    }

    try {
      const info = await this.client.info('memory');
      const keyCount = await this.client.dbSize();

      // Parse memory usage from Redis INFO command
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : '0B';

      this.stats.totalKeys = keyCount;
      this.stats.memoryUsage = memoryUsage;

      return this.stats;

    } catch (error) {
      logger.error('Failed to get cache stats', {
        service: 'cache',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      return this.stats;
    }
  }

  /**
   * Clear all cache data
   */
  public async clearCache(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.client.flushDb();
      
      // Reset stats
      this.stats = {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalKeys: 0,
        memoryUsage: '0MB'
      };

      logger.info('Cache cleared successfully', { service: 'cache' });
      return true;

    } catch (error) {
      logger.error('Failed to clear cache', {
        service: 'cache',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      return false;
    }
  }

  /**
   * Generate cache key for AI responses
   */
  private generateAIResponseKey(userInput: string, context: any): string {
    const inputHash = this.hashString(userInput);
    const contextHash = this.hashObject({
      sessionId: context.sessionId,
      conversationHistory: context.conversationHistory,
      legalDisclaimer: context.legalDisclaimer,
      language: context.language || 'en'
    });
    
    return `${this.AI_RESPONSE_PREFIX}${inputHash}_${contextHash}`;
  }

  /**
   * Generate cache key for TTS audio
   */
  private generateTTSKey(text: string, voice: string, speed: number, language: string): string {
    const textHash = this.hashString(text);
    return `${this.TTS_AUDIO_PREFIX}${textHash}_${voice}_${speed}_${language}`;
  }

  /**
   * Simple hash function for strings
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Hash object for consistent cache keys
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    return this.hashString(str);
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Compress data using gzip
   */
  private async compress(data: string): Promise<string> {
    try {
      // Only compress if data is large enough to benefit
      if (data.length < 1000) {
        return data;
      }
      
      const gzipAsync = promisify(gzip);
      const compressed = await gzipAsync(Buffer.from(data));
      return compressed.toString('base64');
    } catch (error) {
      logger.warn('Compression failed, using uncompressed data', {
        service: 'cache',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      return data;
    }
  }

  /**
   * Decompress gzipped data
   */
  private async decompress(data: string): Promise<string> {
    try {
      // Check if data looks like base64 compressed data
      if (!data.startsWith('H4sI') && !data.match(/^[A-Za-z0-9+/=]+$/)) {
        return data;
      }
      
      const gunzipAsync = promisify(gunzip);
      const buffer = Buffer.from(data, 'base64');
      
      try {
        const decompressed = await gunzipAsync(buffer);
        return decompressed.toString();
      } catch {
        // If gunzip fails, it might not be compressed
        return data;
      }
    } catch (error) {
      logger.warn('Decompression failed, using data as-is', {
        service: 'cache',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      return data;
    }
  }

  /**
   * Close Redis connection
   */
  public async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      logger.info('Redis connection closed', { service: 'cache' });
    }
  }
}

// Create and export singleton instance
export const cacheService = new CacheService();