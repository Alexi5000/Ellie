/**
 * Integration tests for voice processing API endpoints
 * Requirements: 1.3, 5.1, 5.2, 1.4, 5.3
 */

import request from 'supertest';
import { app } from '../index';
import { VoiceProcessingService } from '../services/voiceProcessingService';
import { AIResponseService } from '../services/aiResponseService';
import fs from 'fs';
import path from 'path';

// Mock the services to avoid actual API calls during testing
jest.mock('../services/voiceProcessingService', () => ({
  VoiceProcessingService: jest.fn().mockImplementation(() => ({
    validateAudioFormat: jest.fn(),
    processAudioInput: jest.fn(),
    convertTextToSpeech: jest.fn(),
    getCacheStats: jest.fn()
  }))
}));

jest.mock('../services/aiResponseService', () => ({
  AIResponseService: jest.fn().mockImplementation(() => ({
    generateResponse: jest.fn()
  }))
}));

describe('Voice Processing API Endpoints', () => {
  let mockVoiceService: any;
  let mockAIService: any;

  const createMockAudioFile = () => {
    return Buffer.from('mock-audio-file-content');
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Get the mocked constructors
    const VoiceProcessingService = require('../services/voiceProcessingService').VoiceProcessingService;
    const AIResponseService = require('../services/aiResponseService').AIResponseService;

    // Create mock instances
    mockVoiceService = new VoiceProcessingService();
    mockAIService = new AIResponseService();

    // Setup default mock implementations
    mockVoiceService.validateAudioFormat.mockReturnValue(true);
    mockVoiceService.processAudioInput.mockResolvedValue('Hello, I need legal help');
    mockVoiceService.convertTextToSpeech.mockResolvedValue(Buffer.from('mock-audio-data'));
    mockVoiceService.getCacheStats.mockResolvedValue({
      totalRequests: 100,
      cacheHits: 50,
      cacheMisses: 50,
      hitRate: 0.5
    });
    mockAIService.generateResponse.mockResolvedValue('Hello! I\'m Ellie, your AI legal assistant. How can I help you today?');
  });

  describe('POST /api/voice/process', () => {

    it('should successfully process voice input with valid audio file', async () => {
      const audioBuffer = createMockAudioFile();
      
      const response = await request(app)
        .post('/api/voice/process')
        .attach('audio', audioBuffer, 'test-audio.wav')
        .field('sessionId', 'test-session-123')
        .field('voiceSpeed', '1.0')
        .field('language', 'en')
        .field('legalDisclaimer', 'true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transcribedText');
      expect(response.body.data).toHaveProperty('aiResponse');
      expect(response.body.data).toHaveProperty('audioBuffer');
      expect(response.body.data).toHaveProperty('sessionId');
      expect(response.body.data).toHaveProperty('processingTime');
      
      expect(response.body.data.transcribedText).toBe('Hello, I need legal help');
      expect(response.body.data.aiResponse).toBe('Hello! I\'m Ellie, your AI legal assistant. How can I help you today?');
      expect(response.body.data.sessionId).toBe('test-session-123');

      // Verify service calls
      expect(mockVoiceService.validateAudioFormat).toHaveBeenCalled();
      expect(mockVoiceService.processAudioInput).toHaveBeenCalled();
      expect(mockAIService.generateResponse).toHaveBeenCalledWith(
        'Hello, I need legal help',
        expect.objectContaining({
          sessionId: 'test-session-123',
          legalDisclaimer: true
        })
      );
      expect(mockVoiceService.convertTextToSpeech).toHaveBeenCalledWith(
        'Hello! I\'m Ellie, your AI legal assistant. How can I help you today?',
        'alloy',
        1.0
      );
    });

    it('should return error when no audio file is provided', async () => {
      const response = await request(app)
        .post('/api/voice/process')
        .field('sessionId', 'test-session-123')
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELD');
      expect(response.body.error.message).toContain('Audio file is required');
    });

    it('should return error for invalid audio format', async () => {
      mockVoiceService.validateAudioFormat.mockReturnValue(false);
      
      const audioBuffer = createMockAudioFile();
      
      const response = await request(app)
        .post('/api/voice/process')
        .attach('audio', audioBuffer, 'test-audio.txt')
        .field('sessionId', 'test-session-123')
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('INVALID_AUDIO_FORMAT');
      expect(response.body.error.message).toContain('Invalid audio format');
    });

    it('should handle speech-to-text processing errors', async () => {
      mockVoiceService.processAudioInput.mockRejectedValue(new Error('Whisper API error'));
      
      const audioBuffer = createMockAudioFile();
      
      const response = await request(app)
        .post('/api/voice/process')
        .attach('audio', audioBuffer, 'test-audio.wav')
        .field('sessionId', 'test-session-123')
        .expect(500);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('AUDIO_PROCESSING_FAILED');
    });

    it('should handle AI response generation errors', async () => {
      mockAIService.generateResponse.mockRejectedValue(new Error('AI service error'));
      
      const audioBuffer = createMockAudioFile();
      
      const response = await request(app)
        .post('/api/voice/process')
        .attach('audio', audioBuffer, 'test-audio.wav')
        .field('sessionId', 'test-session-123')
        .expect(500);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('AUDIO_PROCESSING_FAILED');
    });

    it('should handle text-to-speech conversion errors', async () => {
      mockVoiceService.convertTextToSpeech.mockRejectedValue(new Error('TTS API error'));
      
      const audioBuffer = createMockAudioFile();
      
      const response = await request(app)
        .post('/api/voice/process')
        .attach('audio', audioBuffer, 'test-audio.wav')
        .field('sessionId', 'test-session-123')
        .expect(500);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('AUDIO_PROCESSING_FAILED');
    });

    it('should generate session ID when not provided', async () => {
      const audioBuffer = createMockAudioFile();
      
      const response = await request(app)
        .post('/api/voice/process')
        .attach('audio', audioBuffer, 'test-audio.wav')
        .expect(200);

      expect(response.body.data.sessionId).toBeDefined();
      expect(response.body.data.sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should respect voice speed parameter', async () => {
      const audioBuffer = createMockAudioFile();
      
      await request(app)
        .post('/api/voice/process')
        .attach('audio', audioBuffer, 'test-audio.wav')
        .field('voiceSpeed', '1.5')
        .expect(200);

      expect(mockVoiceService.convertTextToSpeech).toHaveBeenCalledWith(
        expect.any(String),
        'alloy',
        1.5
      );
    });

    it('should handle conversation history in context', async () => {
      const audioBuffer = createMockAudioFile();
      const conversationHistory = JSON.stringify([
        {
          id: '1',
          timestamp: new Date(),
          type: 'user',
          content: 'Previous message',
          metadata: {}
        }
      ]);
      
      await request(app)
        .post('/api/voice/process')
        .attach('audio', audioBuffer, 'test-audio.wav')
        .field('conversationHistory', conversationHistory)
        .expect(200);

      expect(mockAIService.generateResponse).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          conversationHistory: expect.arrayContaining([
            expect.objectContaining({
              content: 'Previous message'
            })
          ])
        })
      );
    });
  });

  describe('GET /api/voice/synthesize/:text', () => {
    it('should successfully convert text to speech', async () => {
      const testText = 'Hello, this is a test message';
      const mockAudioBuffer = Buffer.from('mock-audio-data');
      mockVoiceService.convertTextToSpeech.mockResolvedValue(mockAudioBuffer);

      const response = await request(app)
        .get(`/api/voice/synthesize/${encodeURIComponent(testText)}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('audio/mpeg');
      expect(response.headers['content-length']).toBe(mockAudioBuffer.length.toString());
      expect(response.headers['cache-control']).toBe('public, max-age=3600');
      expect(Buffer.from(response.body)).toEqual(mockAudioBuffer);

      expect(mockVoiceService.convertTextToSpeech).toHaveBeenCalledWith(
        testText,
        'alloy',
        1.0
      );
    });

    it('should handle custom voice parameter', async () => {
      const testText = 'Hello world';
      
      await request(app)
        .get(`/api/voice/synthesize/${encodeURIComponent(testText)}`)
        .query({ voice: 'nova' })
        .expect(200);

      expect(mockVoiceService.convertTextToSpeech).toHaveBeenCalledWith(
        testText,
        'nova',
        1.0
      );
    });

    it('should handle custom speed parameter', async () => {
      const testText = 'Hello world';
      
      await request(app)
        .get(`/api/voice/synthesize/${encodeURIComponent(testText)}`)
        .query({ speed: '0.8' })
        .expect(200);

      expect(mockVoiceService.convertTextToSpeech).toHaveBeenCalledWith(
        testText,
        'alloy',
        0.8
      );
    });

    it('should return error for empty text', async () => {
      const response = await request(app)
        .get('/api/voice/synthesize/')
        .expect(404); // Route not found for empty text

      expect(response.body.error).toBeDefined();
    });

    it('should return error for text that is too long', async () => {
      const longText = 'a'.repeat(5000); // Exceeds 4096 character limit
      
      const response = await request(app)
        .get(`/api/voice/synthesize/${encodeURIComponent(longText)}`)
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('INVALID_INPUT');
      expect(response.body.error.message).toContain('too long');
    });

    it('should return error for invalid voice parameter', async () => {
      const testText = 'Hello world';
      
      const response = await request(app)
        .get(`/api/voice/synthesize/${encodeURIComponent(testText)}`)
        .query({ voice: 'invalid-voice' })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('INVALID_INPUT');
      expect(response.body.error.message).toContain('Invalid voice parameter');
    });

    it('should return error for invalid speed parameter', async () => {
      const testText = 'Hello world';
      
      const response = await request(app)
        .get(`/api/voice/synthesize/${encodeURIComponent(testText)}`)
        .query({ speed: '5.0' }) // Exceeds max speed of 4.0
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('INVALID_INPUT');
      expect(response.body.error.message).toContain('Speed must be between');
    });

    it('should handle TTS service errors', async () => {
      mockVoiceService.convertTextToSpeech.mockRejectedValue(new Error('TTS service error'));
      
      const testText = 'Hello world';
      
      const response = await request(app)
        .get(`/api/voice/synthesize/${encodeURIComponent(testText)}`)
        .expect(500);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('AUDIO_PROCESSING_FAILED');
    });

    it('should properly decode URL-encoded text', async () => {
      const testText = 'Hello, how are you today?';
      const encodedText = encodeURIComponent(testText);
      
      await request(app)
        .get(`/api/voice/synthesize/${encodedText}`)
        .expect(200);

      expect(mockVoiceService.convertTextToSpeech).toHaveBeenCalledWith(
        testText,
        'alloy',
        1.0
      );
    });
  });

  describe('GET /api/voice/cache-stats', () => {
    it('should return cache statistics', async () => {
      const mockStats = {
        size: 5,
        keys: ['key1...', 'key2...', 'key3...']
      };
      mockVoiceService.getCacheStats.mockReturnValue(mockStats);

      const response = await request(app)
        .get('/api/voice/cache-stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStats);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should handle cache stats errors', async () => {
      mockVoiceService.getCacheStats.mockImplementation(() => {
        throw new Error('Cache stats error');
      });

      const response = await request(app)
        .get('/api/voice/cache-stats')
        .expect(500);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on voice processing endpoint', async () => {
      const audioBuffer = createMockAudioFile();
      
      // Make multiple requests quickly to trigger rate limiting
      const requests = Array(12).fill(null).map(() =>
        request(app)
          .post('/api/voice/process')
          .attach('audio', audioBuffer, 'test-audio.wav')
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter((res: any) => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      
      if (rateLimitedResponses.length > 0) {
        expect(rateLimitedResponses[0].body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      }
    });

    it('should enforce rate limiting on TTS endpoint', async () => {
      // Make multiple requests quickly to trigger rate limiting
      const requests = Array(22).fill(null).map(() =>
        request(app)
          .get('/api/voice/synthesize/test')
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter((res: any) => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      
      if (rateLimitedResponses.length > 0) {
        expect(rateLimitedResponses[0].body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      }
    });
  });
});