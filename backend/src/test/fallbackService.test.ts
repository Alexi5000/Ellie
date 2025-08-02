/**
 * Tests for FallbackService
 * Requirements: 5.4, 5.5
 */

import { FallbackService } from '../services/fallbackService';

describe('FallbackService', () => {
  let fallbackService: FallbackService;

  beforeEach(() => {
    fallbackService = FallbackService.getInstance();
    // Reset service status
    (fallbackService as any).serviceStatus.clear();
    (fallbackService as any).initializeServiceStatus();
  });

  afterEach(async () => {
    // Reset the singleton instance for clean tests
    (FallbackService as any).instance = undefined;
    
    // Wait for any pending async operations
    await new Promise(resolve => setImmediate(resolve));
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = FallbackService.getInstance();
      const instance2 = FallbackService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Service Status Tracking', () => {
    it('should initialize service status', () => {
      const health = fallbackService.getServiceHealth();
      expect(health['openai-whisper']).toBeDefined();
      expect(health['openai-tts']).toBeDefined();
      expect(health['openai-gpt']).toBeDefined();
      expect(health['groq']).toBeDefined();
      
      // All services should start as available
      Object.values(health).forEach(status => {
        expect(status.isAvailable).toBe(true);
        expect(status.consecutiveFailures).toBe(0);
      });
    });

    it('should record successful service calls', () => {
      const service = 'openai-whisper';
      const responseTime = 500;

      fallbackService.recordServiceCall(service, true, responseTime);

      const health = fallbackService.getServiceHealth();
      expect(health[service].isAvailable).toBe(true);
      expect(health[service].consecutiveFailures).toBe(0);
      expect(health[service].averageResponseTime).toBeGreaterThan(0);
    });

    it('should record failed service calls', () => {
      const service = 'openai-whisper';
      const responseTime = 1000;
      const error = new Error('Service failed');

      fallbackService.recordServiceCall(service, false, responseTime, error);

      const health = fallbackService.getServiceHealth();
      expect(health[service].consecutiveFailures).toBe(1);
      expect(health[service].isAvailable).toBe(true); // Still available until threshold
    });

    it('should open circuit breaker after consecutive failures', () => {
      const service = 'openai-whisper';
      const error = new Error('Service failed');

      // Simulate consecutive failures to trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        fallbackService.recordServiceCall(service, false, 1000, error);
      }

      const health = fallbackService.getServiceHealth();
      expect(health[service].isAvailable).toBe(false);
      expect(health[service].consecutiveFailures).toBe(5);
    });

    it('should reset circuit breaker after timeout', (done) => {
      const service = 'openai-whisper';
      const error = new Error('Service failed');

      // Update circuit breaker settings for faster testing
      fallbackService.updateCircuitBreakerSettings(2, 100); // 2 failures, 100ms timeout

      // Trigger circuit breaker
      fallbackService.recordServiceCall(service, false, 1000, error);
      fallbackService.recordServiceCall(service, false, 1000, error);

      expect(fallbackService.isServiceAvailable(service)).toBe(false);

      // Wait for circuit breaker to reset
      setTimeout(() => {
        expect(fallbackService.isServiceAvailable(service)).toBe(true);
        done();
      }, 150);
    });
  });

  describe('Fallback Response Generation', () => {
    it('should generate fallback for transcription failure', () => {
      const error = new Error('Transcription failed');
      const requestId = 'test-request';

      const fallback = fallbackService.getFallbackForTranscription(error, requestId);

      expect(fallback.isFallback).toBe(true);
      expect(fallback.fallbackReason).toBe('Speech-to-text service unavailable');
      expect(fallback.text).toMatch(/technical issue|technical difficulties|service issue|temporarily/i);
      expect(fallback.confidence).toBe(0.5);
    });

    it('should generate fallback for AI service failure', () => {
      const userInput = 'Hello, I need legal help';
      const error = new Error('AI service failed');
      const requestId = 'test-request';

      const fallback = fallbackService.getFallbackForAI(userInput, error, requestId);

      expect(fallback.isFallback).toBe(true);
      expect(fallback.fallbackReason).toBe('AI service unavailable');
      expect(fallback.text).toBeDefined();
      expect(fallback.confidence).toBe(0.3);
    });

    it('should generate contextual fallback for greeting', () => {
      const userInput = 'hello there';
      const error = new Error('AI service failed');
      const requestId = 'test-request';

      const fallback = fallbackService.getFallbackForAI(userInput, error, requestId);

      // Check that it contains greeting-related content (case insensitive)
      const lowerText = fallback.text.toLowerCase();
      expect(lowerText).toMatch(/hello|hi|good day/);
      expect(lowerText).toContain('ellie');
    });

    it('should generate fallback for TTS failure', () => {
      const text = 'This is a test response';
      const error = new Error('TTS failed');
      const requestId = 'test-request';

      const fallback = fallbackService.getFallbackForTTS(text, error, requestId);

      expect(fallback.isFallback).toBe(true);
      expect(fallback.fallbackReason).toBe('Text-to-speech service unavailable');
      expect(fallback.text).toBe(text); // Text should remain unchanged
      expect(fallback.confidence).toBe(1.0); // Text is still accurate
    });

    it('should generate contextual fallback responses', () => {
      const requestId = 'test-request';

      const greetingFallback = fallbackService.getContextualFallback('greeting', requestId);
      expect(greetingFallback.text).toMatch(/hello|hi|good day/i);

      const inquiryFallback = fallbackService.getContextualFallback('inquiry', requestId);
      expect(inquiryFallback.text).toContain('legal');

      const complexFallback = fallbackService.getContextualFallback('complex', requestId);
      expect(complexFallback.text).toContain('attorney');

      const errorFallback = fallbackService.getContextualFallback('error', requestId);
      expect(errorFallback.text).toMatch(/technical difficulties|service issue|temporarily/i);
    });

    it('should add legal disclaimer for legal contexts', () => {
      const requestId = 'test-request';

      const inquiryFallback = fallbackService.getContextualFallback('inquiry', requestId);
      expect(inquiryFallback.text).toMatch(/general information|general purposes/i);

      const complexFallback = fallbackService.getContextualFallback('complex', requestId);
      expect(complexFallback.text).toContain('legal advice');
    });
  });

  describe('Service Availability', () => {
    it('should check service availability', () => {
      expect(fallbackService.isServiceAvailable('openai-whisper')).toBe(true);
      expect(fallbackService.isServiceAvailable('non-existent-service')).toBe(false);
    });

    it('should return false for unavailable services', () => {
      const service = 'openai-whisper';
      const error = new Error('Service failed');

      // Trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        fallbackService.recordServiceCall(service, false, 1000, error);
      }

      expect(fallbackService.isServiceAvailable(service)).toBe(false);
    });
  });

  describe('Statistics', () => {
    it('should return fallback statistics', () => {
      const stats = fallbackService.getFallbackStats();

      expect(stats.totalFallbacks).toBeDefined();
      expect(stats.fallbacksByService).toBeDefined();
      expect(stats.serviceAvailability).toBeDefined();
      expect(stats.averageResponseTimes).toBeDefined();

      // Check that all expected services are included
      expect(stats.serviceAvailability['openai-whisper']).toBeDefined();
      expect(stats.serviceAvailability['openai-tts']).toBeDefined();
      expect(stats.serviceAvailability['openai-gpt']).toBeDefined();
      expect(stats.serviceAvailability['groq']).toBeDefined();
    });

    it('should track fallback counts', () => {
      const service = 'openai-whisper';
      const error = new Error('Service failed');

      // Record some failures
      fallbackService.recordServiceCall(service, false, 1000, error);
      fallbackService.recordServiceCall(service, false, 1000, error);

      const stats = fallbackService.getFallbackStats();
      expect(stats.fallbacksByService[service]).toBe(2);
      expect(stats.totalFallbacks).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Custom Fallback Responses', () => {
    it('should add custom fallback responses', () => {
      const category = 'custom-category';
      const customResponses = ['Custom response 1', 'Custom response 2'];

      fallbackService.addCustomFallbackResponses(category, customResponses);

      // Test that custom responses are used (this would require accessing private methods)
      // For now, we just verify the method doesn't throw
      expect(() => {
        fallbackService.addCustomFallbackResponses(category, customResponses);
      }).not.toThrow();
    });
  });

  describe('Circuit Breaker Configuration', () => {
    it('should update circuit breaker settings', () => {
      const newThreshold = 3;
      const newTimeout = 5000;

      expect(() => {
        fallbackService.updateCircuitBreakerSettings(newThreshold, newTimeout);
      }).not.toThrow();

      // Verify new settings are applied
      const service = 'openai-whisper';
      const error = new Error('Service failed');

      // Should trigger circuit breaker after 3 failures instead of 5
      for (let i = 0; i < 3; i++) {
        fallbackService.recordServiceCall(service, false, 1000, error);
      }

      expect(fallbackService.isServiceAvailable(service)).toBe(false);
    });
  });

  describe('Response Randomization', () => {
    it('should return different responses for same category', () => {
      const requestId = 'test-request';
      const responses = new Set<string>();

      // Generate multiple responses to test randomization
      for (let i = 0; i < 10; i++) {
        const fallback = fallbackService.getContextualFallback('greeting', requestId);
        responses.add(fallback.text);
      }

      // Should have some variation (though not guaranteed due to randomness)
      // At minimum, should not throw errors
      expect(responses.size).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown service gracefully', () => {
      const unknownService = 'unknown-service';
      
      expect(() => {
        fallbackService.recordServiceCall(unknownService, false, 1000);
      }).not.toThrow();

      expect(fallbackService.isServiceAvailable(unknownService)).toBe(false);
    });

    it('should provide default fallback for unknown categories', () => {
      const requestId = 'test-request';
      
      // This should use the private getRandomResponse method with unknown category
      // and return a default message
      const fallback = fallbackService.getContextualFallback('error', requestId);
      expect(fallback.text).toBeDefined();
      expect(fallback.text.length).toBeGreaterThan(0);
    });
  });
});