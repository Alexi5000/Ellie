// Environment setup for Jest tests
// This file runs before all tests to ensure proper environment configuration

// Mock services first before any other imports
const sharedMockVoiceProcessingService = {
  validateAudioFormat: jest.fn().mockImplementation((file: any) => {
    if (process.env.NODE_ENV !== 'test' || process.env.JEST_VERBOSE === 'true') {
      console.log('MOCK: validateAudioFormat called with:', file ? 'file object' : 'no file');
    }
    return true;
  }),
  processAudioInput: jest.fn().mockImplementation(async (buffer: any, filename: any) => {
    if (process.env.NODE_ENV !== 'test' || process.env.JEST_VERBOSE === 'true') {
      console.log('MOCK: processAudioInput called with buffer size:', buffer?.length, 'filename:', filename);
    }
    return 'Mock transcription';
  }),
  convertTextToSpeech: jest.fn().mockImplementation(async (text: any, voice: any, speed: any) => {
    if (process.env.NODE_ENV !== 'test' || process.env.JEST_VERBOSE === 'true') {
      console.log('MOCK: convertTextToSpeech called with text:', text, 'voice:', voice, 'speed:', speed);
    }
    return Buffer.from('mock-audio-data');
  }),
  getCacheStats: jest.fn().mockReturnValue({ size: 0, keys: [] }),
  clearTTSCache: jest.fn(),
  createAudioInput: jest.fn()
};

const sharedMockAIResponseService = {
  generateResponse: jest.fn().mockImplementation(async (userInput: any, context: any) => {
    if (process.env.NODE_ENV !== 'test' || process.env.JEST_VERBOSE === 'true') {
      console.log('MOCK: generateResponse called with input:', userInput, 'context keys:', Object.keys(context || {}));
    }
    return 'Mock AI response';
  }),
  routeToOptimalAPI: jest.fn().mockReturnValue('groq'),
  processWithGroq: jest.fn().mockResolvedValue('Mock Groq response'),
  processWithOpenAI: jest.fn().mockResolvedValue('Mock OpenAI response'),
  validateLegalCompliance: jest.fn().mockResolvedValue(true),
  handleFallbackResponses: jest.fn().mockReturnValue('Fallback response')
};

// Create mock classes that can be instantiated
class MockVoiceProcessingService {
  validateAudioFormat = sharedMockVoiceProcessingService.validateAudioFormat;
  processAudioInput = sharedMockVoiceProcessingService.processAudioInput;
  convertTextToSpeech = sharedMockVoiceProcessingService.convertTextToSpeech;
  getCacheStats = sharedMockVoiceProcessingService.getCacheStats;
  clearTTSCache = sharedMockVoiceProcessingService.clearTTSCache;
  createAudioInput = sharedMockVoiceProcessingService.createAudioInput;
}

class MockAIResponseService {
  generateResponse = sharedMockAIResponseService.generateResponse;
  routeToOptimalAPI = sharedMockAIResponseService.routeToOptimalAPI;
  processWithGroq = sharedMockAIResponseService.processWithGroq;
  processWithOpenAI = sharedMockAIResponseService.processWithOpenAI;
  validateLegalCompliance = sharedMockAIResponseService.validateLegalCompliance;
  handleFallbackResponses = sharedMockAIResponseService.handleFallbackResponses;
}

jest.mock('../services/voiceProcessingService', () => {
  if (process.env.NODE_ENV !== 'test' || process.env.JEST_VERBOSE === 'true') {
    console.log('VoiceProcessingService mock being created in env-setup');
  }
  return {
    VoiceProcessingService: MockVoiceProcessingService,
    // Export singleton instance for compatibility
    voiceProcessingService: new MockVoiceProcessingService()
  };
});

jest.mock('../services/aiResponseService', () => {
  if (process.env.NODE_ENV !== 'test' || process.env.JEST_VERBOSE === 'true') {
    console.log('AIResponseService mock being created in env-setup');
  }
  return {
    AIResponseService: MockAIResponseService,
    // Export singleton instance for compatibility
    aiResponseService: new MockAIResponseService()
  };
});

// Make mocks available globally
(global as any).sharedMockVoiceProcessingService = sharedMockVoiceProcessingService;
(global as any).sharedMockAIResponseService = sharedMockAIResponseService;
(global as any).MockVoiceProcessingService = MockVoiceProcessingService;
(global as any).MockAIResponseService = MockAIResponseService;

import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
const testEnvPath = path.resolve(__dirname, '../../../.env.test');
dotenv.config({ path: testEnvPath });

// Ensure NODE_ENV is set to test
process.env.NODE_ENV = 'test';

// Set mock API keys if not provided - ensure they're always set for tests
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test_openai_api_key_mock_1234567890abcdef';
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || 'gsk_test_groq_api_key_mock_1234567890abcdef';

// Validate API keys are set
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
  process.env.OPENAI_API_KEY = 'sk-test_openai_api_key_mock_1234567890abcdef';
}

if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
  process.env.GROQ_API_KEY = 'gsk_test_groq_api_key_mock_1234567890abcdef';
}

// Set other required test environment variables
process.env.PORT = process.env.PORT || '0';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';
process.env.REDIS_DB = process.env.REDIS_DB || '1';

// Disable external services for testing
process.env.CDN_ENABLED = 'false';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Audio processing settings for tests
process.env.MAX_AUDIO_FILE_SIZE = process.env.MAX_AUDIO_FILE_SIZE || '10485760';
process.env.ALLOWED_AUDIO_FORMATS = process.env.ALLOWED_AUDIO_FORMATS || 'audio/wav,audio/mp3,audio/m4a,audio/webm';

// Rate limiting settings for tests (more lenient for normal tests, but configurable for rate limit tests)
process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || '60000';
process.env.RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || '1000';
process.env.VOICE_RATE_LIMIT_MAX_REQUESTS = process.env.VOICE_RATE_LIMIT_MAX_REQUESTS || '10';
process.env.TTS_RATE_LIMIT_MAX_REQUESTS = process.env.TTS_RATE_LIMIT_MAX_REQUESTS || '20';

// Session configuration
process.env.SESSION_TIMEOUT_MS = process.env.SESSION_TIMEOUT_MS || '1800000';

// Database configuration for tests
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_NAME = process.env.DB_NAME || 'ellie_test_db';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.DB_SSL = process.env.DB_SSL || 'false';
process.env.DB_POOL_SIZE = process.env.DB_POOL_SIZE || '5';
process.env.DB_CONNECTION_TIMEOUT = process.env.DB_CONNECTION_TIMEOUT || '10000';
process.env.DB_IDLE_TIMEOUT = process.env.DB_IDLE_TIMEOUT || '60000';

// Log environment setup for debugging (only if verbose mode is enabled)
if (process.env.JEST_VERBOSE === 'true') {
  console.log('Test environment setup completed:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '[SET]' : '[NOT SET]',
    GROQ_API_KEY: process.env.GROQ_API_KEY ? '[SET]' : '[NOT SET]',
    LOG_LEVEL: process.env.LOG_LEVEL,
    REDIS_DB: process.env.REDIS_DB
  });
}