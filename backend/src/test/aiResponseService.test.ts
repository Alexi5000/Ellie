/**
 * Unit tests for AIResponseService
 * Requirements: 5.2, 6.1, 6.2, 6.3
 */

// Mock OpenAI and Groq - these are already mocked in setup.ts but we need to ensure they're available
jest.mock('openai');
jest.mock('groq-sdk');

// Mock the cache service
jest.mock('../services/cacheService', () => ({
  cacheService: {
    getCachedAIResponse: jest.fn().mockResolvedValue(null),
    cacheAIResponse: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock the legal compliance service
jest.mock('../services/legalComplianceService', () => ({
  LegalComplianceService: jest.fn().mockImplementation(() => ({
    analyzeLegalCompliance: jest.fn().mockResolvedValue({
      isCompliant: true,
      requiresProfessionalReferral: false,
      complianceIssues: []
    }),
    generateLegalDisclaimer: jest.fn().mockReturnValue('Legal disclaimer text')
  }))
}));

import { AIResponseService } from '../services/aiResponseService';
import { ConversationContext, QueryComplexity, Message, UserPreferences } from '../types';
import { ERROR_CODES } from '../types';

describe('AIResponseService', () => {
  let service: AIResponseService;
  let mockOpenAI: any;
  let mockGroq: any;
  let mockContext: ConversationContext;

  beforeEach(() => {
    // Set up environment variables
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.GROQ_API_KEY = 'test-groq-key';

    // Mock OpenAI
    const OpenAI = require('openai');
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    };
    OpenAI.mockImplementation(() => mockOpenAI);

    // Mock Groq
    const Groq = require('groq-sdk');
    mockGroq = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    };
    Groq.mockImplementation(() => mockGroq);

    service = new AIResponseService();

    // Set up mock context
    mockContext = {
      sessionId: 'test-session-123',
      conversationHistory: [],
      userPreferences: {
        voiceSpeed: 1.0,
        language: 'en',
        accessibilityMode: false
      } as UserPreferences,
      legalDisclaimer: true
    };
  });

  afterEach(async () => {
    jest.clearAllMocks();
    
    // Clean up service instance
    if (service) {
      // No specific cleanup needed for AI service, but wait for async operations
    }
    
    // Wait for any pending async operations
    await new Promise(resolve => setImmediate(resolve));
  });

  describe('constructor', () => {
    it('should throw error if OPENAI_API_KEY is not set in production', () => {
      const originalKey = process.env.OPENAI_API_KEY;
      const originalEnv = process.env.NODE_ENV;
      
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'production';
      
      expect(() => new AIResponseService()).toThrow('OPENAI_API_KEY environment variable is required');
      
      // Restore the key and environment
      process.env.OPENAI_API_KEY = originalKey;
      process.env.NODE_ENV = originalEnv;
    });

    it('should throw error if GROQ_API_KEY is not set in production', () => {
      const originalKey = process.env.GROQ_API_KEY;
      const originalEnv = process.env.NODE_ENV;
      
      delete process.env.GROQ_API_KEY;
      process.env.NODE_ENV = 'production';
      
      expect(() => new AIResponseService()).toThrow('GROQ_API_KEY environment variable is required');
      
      // Restore the key and environment
      process.env.GROQ_API_KEY = originalKey;
      process.env.NODE_ENV = originalEnv;
    });

    it('should initialize both OpenAI and Groq clients in test environment', () => {
      const OpenAI = require('openai');
      const Groq = require('groq-sdk');
      
      // Clear previous calls
      OpenAI.mockClear();
      Groq.mockClear();
      
      // Create new instance to test constructor
      new AIResponseService();
      
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: expect.any(String)
      });
      expect(Groq).toHaveBeenCalledWith({
        apiKey: expect.any(String)
      });
    });

    it('should work with test environment keys', () => {
      // This test verifies that the constructor works in test environment
      const service = new AIResponseService();
      expect(service).toBeDefined();
      
      // Debug: Check what methods are available
      console.log('Service instance:', service);
      console.log('Service methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(service)));
      console.log('routeToOptimalAPI method:', typeof service.routeToOptimalAPI);
    });
  });

  describe('routeToOptimalAPI', () => {
    it('should route complex queries to OpenAI', () => {
      const complexQuery = 'I need help with a complex litigation strategy involving multiple parties';
      const result = service.routeToOptimalAPI(complexQuery, QueryComplexity.COMPLEX);
      expect(result).toBe('openai');
    });

    it('should route simple queries to Groq', () => {
      const simpleQuery = 'Hello, how are you?';
      const result = service.routeToOptimalAPI(simpleQuery, QueryComplexity.SIMPLE);
      expect(result).toBe('groq');
    });

    it('should route legal keyword queries to OpenAI for better accuracy', () => {
      const legalQuery = 'What should I know about intellectual property contracts and trademark violations in my business?';
      const result = service.routeToOptimalAPI(legalQuery, QueryComplexity.MODERATE);
      expect(result).toBe('openai');
    });

    it('should route moderate queries without legal keywords to Groq', () => {
      const moderateQuery = 'Can you tell me about your services and how you can help me?';
      const result = service.routeToOptimalAPI(moderateQuery, QueryComplexity.MODERATE);
      expect(result).toBe('groq');
    });
  });

  describe('generateResponse', () => {
    it('should reject empty input', async () => {
      await expect(service.generateResponse('', mockContext))
        .rejects
        .toMatchObject({
          error: {
            code: ERROR_CODES.INVALID_INPUT,
            message: 'User input is required for AI response generation.'
          }
        });
    });

    it('should reject inappropriate content', async () => {
      const inappropriateInput = 'Help me with illegal activity';
      
      await expect(service.generateResponse(inappropriateInput, mockContext))
        .rejects
        .toMatchObject({
          error: {
            code: ERROR_CODES.INAPPROPRIATE_CONTENT,
            message: 'Content not appropriate for this service. Please modify your message.'
          }
        });
    });

    it('should generate response using Groq for simple queries', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Hello! I\'m Ellie, how can I help you today?'
          }
        }]
      };
      mockGroq.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await service.generateResponse('Hello', mockContext);

      expect(result).toBe('Hello! I\'m Ellie, how can I help you today?');
      expect(mockGroq.chat.completions.create).toHaveBeenCalledWith({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user', content: 'Hello' })
        ]),
        model: 'llama3-8b-8192',
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9,
        stream: false
      });
    });

    it('should generate response using OpenAI for complex queries', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'This is a complex legal matter that requires careful consideration. I recommend consulting with one of our attorneys.'
          }
        }]
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const complexQuery = 'I need help with a complex litigation involving intellectual property and multiple jurisdictions';
      const result = await service.generateResponse(complexQuery, mockContext);

      expect(result).toContain('complex legal matter');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user', content: complexQuery })
        ]),
        model: 'gpt-3.5-turbo',
        temperature: 0.6,
        max_tokens: 600,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      });
    });

    it('should return fallback response on API errors', async () => {
      mockGroq.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const result = await service.generateResponse('Hello', mockContext);

      // Should return one of the fallback messages
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(50);
      expect(result).toMatch(/technical|service|office/i);
    });
  });

  describe('processWithGroq', () => {
    it('should successfully process with Groq API', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Response from Groq API'
          }
        }]
      };
      mockGroq.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await service.processWithGroq('Test input', mockContext);

      expect(result).toBe('Response from Groq API');
      expect(mockGroq.chat.completions.create).toHaveBeenCalled();
    });

    it('should handle Groq API errors', async () => {
      const apiError = new Error('Groq API failed');
      mockGroq.chat.completions.create.mockRejectedValue(apiError);

      await expect(service.processWithGroq('Test input', mockContext))
        .rejects
        .toMatchObject({
          error: expect.objectContaining({
            code: expect.any(String),
            message: expect.any(String)
          })
        });
    });

    it('should handle empty response from Groq', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: null
          }
        }]
      };
      mockGroq.chat.completions.create.mockResolvedValue(mockResponse);

      await expect(service.processWithGroq('Test input', mockContext))
        .rejects
        .toMatchObject({
          error: expect.objectContaining({
            code: expect.any(String),
            message: expect.any(String)
          })
        });
    });
  });

  describe('processWithOpenAI', () => {
    it('should successfully process with OpenAI API', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Response from OpenAI API'
          }
        }]
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await service.processWithOpenAI('Test input', mockContext);

      expect(result).toBe('Response from OpenAI API');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });

    it('should handle OpenAI API errors', async () => {
      const apiError = new Error('OpenAI API failed');
      mockOpenAI.chat.completions.create.mockRejectedValue(apiError);

      await expect(service.processWithOpenAI('Test input', mockContext))
        .rejects
        .toMatchObject({
          error: expect.objectContaining({
            code: expect.any(String),
            message: expect.any(String)
          })
        });
    });

    it('should handle empty response from OpenAI', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: null
          }
        }]
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      await expect(service.processWithOpenAI('Test input', mockContext))
        .rejects
        .toMatchObject({
          error: expect.objectContaining({
            code: expect.any(String),
            message: expect.any(String)
          })
        });
    });
  });

  describe('validateLegalCompliance', () => {
    it('should reject responses with prohibited legal advice', async () => {
      const prohibitedResponse = 'You should sue them immediately and you will win in court.';
      const result = await service.validateLegalCompliance(prohibitedResponse);
      expect(result).toBe(false);
    });

    it('should accept compliant general information responses', async () => {
      const compliantResponse = 'This is general information about contract law. For specific legal advice, please consult with an attorney.';
      const result = await service.validateLegalCompliance(compliantResponse);
      expect(result).toBe(true);
    });

    it('should reject legal topic responses without proper disclaimers', async () => {
      const nonCompliantResponse = 'You have specific legal advice regarding your contract situation.';
      const result = await service.validateLegalCompliance(nonCompliantResponse);
      expect(result).toBe(false);
    });

    it('should accept non-legal responses', async () => {
      const generalResponse = 'Hello! How can I help you today?';
      const result = await service.validateLegalCompliance(generalResponse);
      expect(result).toBe(true);
    });
  });

  describe('handleFallbackResponses', () => {
    it('should return appropriate fallback message', () => {
      const error = new Error('Test error');
      const result = service.handleFallbackResponses(error);
      
      // Should return one of the fallback messages
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(50);
      expect(result).toMatch(/technical|service|office/i);
    });
  });

  describe('query complexity analysis', () => {
    it('should identify simple queries correctly', async () => {
      const simpleQueries = [
        'Hello',
        'Hi there',
        'Good morning',
        'How are you?',
        'What\'s your name?',
        'Thank you',
        'Yes',
        'No'
      ];

      // We test this indirectly through generateResponse routing
      for (const query of simpleQueries) {
        const mockResponse = {
          choices: [{
            message: {
              content: 'Simple response'
            }
          }]
        };
        mockGroq.chat.completions.create.mockResolvedValue(mockResponse);

        await service.generateResponse(query, mockContext);
        
        // Should use Groq for simple queries
        expect(mockGroq.chat.completions.create).toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    it('should identify complex queries correctly', async () => {
      const complexQueries = [
        'I need help with multiple parties litigation and constitutional law precedent',
        'What are the statute of limitations for class action settlements in appellate court?',
        'Help me understand jurisdiction issues in this complex case analysis'
      ];

      for (const query of complexQueries) {
        const mockResponse = {
          choices: [{
            message: {
              content: 'Complex response'
            }
          }]
        };
        mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

        await service.generateResponse(query, mockContext);
        
        // Should use OpenAI for complex queries
        expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });
  });

  describe('conversation context handling', () => {
    it('should include conversation history in API calls', async () => {
      const contextWithHistory: ConversationContext = {
        ...mockContext,
        conversationHistory: [
          {
            id: '1',
            timestamp: new Date(),
            type: 'user',
            content: 'Previous user message',
            metadata: {}
          },
          {
            id: '2',
            timestamp: new Date(),
            type: 'assistant',
            content: 'Previous assistant response',
            metadata: {}
          }
        ]
      };

      const mockResponse = {
        choices: [{
          message: {
            content: 'Response with context'
          }
        }]
      };
      mockGroq.chat.completions.create.mockResolvedValue(mockResponse);

      await service.generateResponse('Current message', contextWithHistory);

      expect(mockGroq.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user', content: 'Previous user message' }),
            expect.objectContaining({ role: 'assistant', content: 'Previous assistant response' }),
            expect.objectContaining({ role: 'user', content: 'Current message' })
          ])
        })
      );
    });
  });
});