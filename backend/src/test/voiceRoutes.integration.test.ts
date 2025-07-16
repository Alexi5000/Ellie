/**
 * Simple integration tests for voice processing API endpoints
 * Requirements: 1.3, 5.1, 5.2, 1.4, 5.3
 */

import request from 'supertest';
import { app } from '../index';

describe('Voice Processing API Integration Tests', () => {
  describe('API Structure Tests', () => {
    it('should have voice processing endpoint available', async () => {
      const response = await request(app)
        .post('/api/voice/process')
        .expect(400); // Expect 400 because no audio file is provided

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELD');
      expect(response.body.error.message).toContain('Audio file is required');
    });

    it('should have text-to-speech endpoint available', async () => {
      const response = await request(app)
        .get('/api/voice/synthesize/')
        .expect(404); // Expect 404 because no text parameter is provided

      expect(response.body.error).toBeDefined();
    });

    it('should have cache stats endpoint available', async () => {
      const response = await request(app)
        .get('/api/voice/cache-stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it('should validate text length for TTS endpoint', async () => {
      const longText = 'a'.repeat(5000); // Exceeds 4096 character limit
      
      const response = await request(app)
        .get(`/api/voice/synthesize/${encodeURIComponent(longText)}`)
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('INVALID_INPUT');
      expect(response.body.error.message).toContain('too long');
    });

    it('should validate voice parameter for TTS endpoint', async () => {
      const testText = 'Hello world';
      
      const response = await request(app)
        .get(`/api/voice/synthesize/${encodeURIComponent(testText)}`)
        .query({ voice: 'invalid-voice' })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('INVALID_INPUT');
      expect(response.body.error.message).toContain('Invalid voice parameter');
    });

    it('should validate speed parameter for TTS endpoint', async () => {
      const testText = 'Hello world';
      
      const response = await request(app)
        .get(`/api/voice/synthesize/${encodeURIComponent(testText)}`)
        .query({ speed: '5.0' }) // Exceeds max speed of 4.0
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('INVALID_INPUT');
      expect(response.body.error.message).toContain('Speed must be between');
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should enforce rate limiting on voice processing endpoint', async () => {
      // Make multiple requests quickly to trigger rate limiting
      const requests = Array(12).fill(null).map(() =>
        request(app)
          .post('/api/voice/process')
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

  describe('Error Handling Tests', () => {
    it('should handle invalid audio format in file filter', async () => {
      const textBuffer = Buffer.from('This is not an audio file');
      
      const response = await request(app)
        .post('/api/voice/process')
        .attach('audio', textBuffer, 'test-file.txt')
        .expect(500); // Multer error handling

      expect(response.body.error).toBeDefined();
    });

    it('should handle empty text parameter', async () => {
      const response = await request(app)
        .get('/api/voice/synthesize/ ')
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });
  });
});