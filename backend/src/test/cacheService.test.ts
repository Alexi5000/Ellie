/**
 * Cache Service Tests
 * Requirements: 15.1 - Advanced caching strategies testing
 */

import { CacheService, cacheService } from '../services/cacheService';

// Mock Redis client
const mockRedisClient = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  isReady: true,
  setEx: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  info: jest.fn(),
  dbSize: jest.fn(),
  flushDb: jest.fn(),
  on: jest.fn()
};

// Mock Redis module
jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient)
}));

describe('CacheService', () => {
  let testCacheService: CacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a new instance for testing to avoid singleton issues
    testCacheService = new CacheService();
    
    // Mock the Redis client connection
    mockRedisClient.connect.mockResolvedValue(undefined);
    mockRedisClient.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'ready') {
        // Simulate successful connection
        setTimeout(() => callback(), 0);
      }
      return mockRedisClient;
    });
    
    // Simulate connected state
    (testCacheService as any).isConnected = true;
    (testCacheService as any).client = mockRedisClient;
  });

  afterEach(async () => {
    jest.clearAllMocks();
    
    // Clean up cache service instance
    if (testCacheService) {
      // Simulate disconnection to prevent hanging connections
      (testCacheService as any).isConnected = false;
      (testCacheService as any).client = null;
    }
    
    // Wait for any pending async operations
    await new Promise(resolve => setImmediate(resolve));
  });

  describe('AI Response Caching', () => {
    it('should cache AI response successfully', async () => {
      mockRedisClient.setEx.mockResolvedValue('OK');

      const userInput = 'Hello, how can you help me?';
      const context = { sessionId: 'test-session', conversationHistory: [] };
      const response = 'I can help you with legal information.';

      const result = await testCacheService.cacheAIResponse(userInput, context, response);

      expect(result).toBe(true);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        expect.stringContaining('ai_response:'),
        3600,
        expect.stringContaining(response)
      );
    });

    it('should retrieve cached AI response', async () => {
      const cachedData = JSON.stringify({
        response: 'Cached response',
        timestamp: Date.now(),
        userInput: 'Hello',
        contextHash: 'hash123'
      });

      mockRedisClient.get.mockResolvedValue(cachedData);

      const userInput = 'Hello, how can you help me?';
      const context = { sessionId: 'test-session', conversationHistory: [] };

      const result = await testCacheService.getCachedAIResponse(userInput, context);

      expect(result).toBe('Cached response');
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        expect.stringContaining('ai_response:')
      );
    });

    it('should return null for cache miss', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const userInput = 'Hello, how can you help me?';
      const context = { sessionId: 'test-session', conversationHistory: [] };

      const result = await testCacheService.getCachedAIResponse(userInput, context);

      expect(result).toBeNull();
    });

    it('should handle cache errors gracefully', async () => {
      mockRedisClient.setEx.mockRejectedValue(new Error('Redis error'));

      const userInput = 'Hello, how can you help me?';
      const context = { sessionId: 'test-session', conversationHistory: [] };
      const response = 'I can help you with legal information.';

      const result = await testCacheService.cacheAIResponse(userInput, context, response);

      expect(result).toBe(false);
    });
  });

  describe('TTS Audio Caching', () => {
    it('should cache TTS audio successfully', async () => {
      mockRedisClient.setEx.mockResolvedValue('OK');

      const text = 'Hello, this is a test message';
      const voice = 'alloy';
      const speed = 1.0;
      const audioBuffer = Buffer.from('fake audio data');

      const result = await testCacheService.cacheTTSAudio(text, voice, speed, audioBuffer);

      expect(result).toBe(true);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        expect.stringContaining('tts_audio:'),
        7200,
        expect.stringContaining(audioBuffer.toString('base64'))
      );
    });

    it('should retrieve cached TTS audio', async () => {
      const audioBuffer = Buffer.from('fake audio data');
      const cachedData = JSON.stringify({
        audioBuffer: audioBuffer.toString('base64'),
        timestamp: Date.now(),
        text: 'Hello',
        voice: 'alloy',
        speed: 1.0,
        bufferLength: audioBuffer.length
      });

      mockRedisClient.get.mockResolvedValue(cachedData);

      const text = 'Hello, this is a test message';
      const voice = 'alloy';
      const speed = 1.0;

      const result = await testCacheService.getCachedTTSAudio(text, voice, speed);

      expect(result).toEqual(audioBuffer);
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        expect.stringContaining('tts_audio:')
      );
    });

    it('should return null for TTS cache miss', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const text = 'Hello, this is a test message';
      const voice = 'alloy';
      const speed = 1.0;

      const result = await testCacheService.getCachedTTSAudio(text, voice, speed);

      expect(result).toBeNull();
    });
  });

  describe('User Session Caching', () => {
    it('should cache user session successfully', async () => {
      mockRedisClient.setEx.mockResolvedValue('OK');

      const sessionId = 'test-session-123';
      const sessionData = { userId: 'user123', preferences: { voice: 'alloy' } };

      const result = await testCacheService.cacheUserSession(sessionId, sessionData);

      expect(result).toBe(true);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        `user_session:${sessionId}`,
        1800,
        expect.stringContaining('user123')
      );
    });

    it('should retrieve cached user session', async () => {
      const sessionData = { userId: 'user123', preferences: { voice: 'alloy' }, timestamp: Date.now() };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(sessionData));

      const sessionId = 'test-session-123';

      const result = await testCacheService.getCachedUserSession(sessionId);

      expect(result).toEqual(sessionData);
      expect(mockRedisClient.get).toHaveBeenCalledWith(`user_session:${sessionId}`);
    });
  });

  describe('Cache Management', () => {
    it('should invalidate cache entries by pattern', async () => {
      const keys = ['ai_response:key1', 'ai_response:key2', 'ai_response:key3'];
      mockRedisClient.keys.mockResolvedValue(keys);
      mockRedisClient.del.mockResolvedValue(3);

      const pattern = 'ai_response:*';
      const result = await testCacheService.invalidateByPattern(pattern);

      expect(result).toBe(3);
      expect(mockRedisClient.keys).toHaveBeenCalledWith(pattern);
      expect(mockRedisClient.del).toHaveBeenCalledWith(keys);
    });

    it('should clear all cache entries', async () => {
      mockRedisClient.flushDb.mockResolvedValue('OK');

      const result = await testCacheService.clearCache();

      expect(result).toBe(true);
      expect(mockRedisClient.flushDb).toHaveBeenCalled();
    });

    it('should get cache statistics', async () => {
      mockRedisClient.info.mockResolvedValue('used_memory_human:10.5M\nother_info:value');
      mockRedisClient.dbSize.mockResolvedValue(150);

      const stats = await testCacheService.getCacheStats();

      expect(stats).toEqual(
        expect.objectContaining({
          totalKeys: 150,
          memoryUsage: '10.5M'
        })
      );
    });
  });

  describe('Availability and Error Handling', () => {
    it('should return false when Redis is not available', () => {
      (testCacheService as any).isConnected = false;

      expect(testCacheService.isAvailable()).toBe(false);
    });

    it('should handle Redis connection errors', async () => {
      (testCacheService as any).isConnected = false;

      const result = await testCacheService.cacheAIResponse('test', {}, 'response');

      expect(result).toBe(false);
    });

    it('should handle invalid cached data gracefully', async () => {
      mockRedisClient.get.mockResolvedValue('invalid json data');

      const result = await testCacheService.getCachedAIResponse('test', {});

      expect(result).toBeNull();
    });
  });

  describe('Key Generation', () => {
    it('should generate consistent keys for same input', async () => {
      mockRedisClient.setEx.mockResolvedValue('OK');

      const userInput = 'Hello, how can you help me?';
      const context = { sessionId: 'test-session', conversationHistory: [] };

      await testCacheService.cacheAIResponse(userInput, context, 'response1');
      await testCacheService.cacheAIResponse(userInput, context, 'response2');

      const calls = mockRedisClient.setEx.mock.calls;
      expect(calls[0][0]).toBe(calls[1][0]); // Same cache key
    });

    it('should generate different keys for different contexts', async () => {
      mockRedisClient.setEx.mockResolvedValue('OK');

      const userInput = 'Hello, how can you help me?';
      const context1 = { sessionId: 'session1', conversationHistory: [] };
      const context2 = { sessionId: 'session2', conversationHistory: [] };

      await testCacheService.cacheAIResponse(userInput, context1, 'response1');
      await testCacheService.cacheAIResponse(userInput, context2, 'response2');

      const calls = mockRedisClient.setEx.mock.calls;
      expect(calls[0][0]).not.toBe(calls[1][0]); // Different cache keys
    });
  });
});