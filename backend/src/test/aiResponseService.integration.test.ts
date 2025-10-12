/**
 * AI Response Service Integration Tests
 * Tests the complete AI response generation workflow
 */

import { AIResponseService } from '../services/aiResponseService';
import { ConversationContext, QueryComplexity } from '../types';

// Mock environment variables for testing
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.GROQ_API_KEY = 'test-groq-key';
process.env.NODE_ENV = 'test';

describe('AIResponseService Integration', () => {
  let aiService: AIResponseService;
  let mockContext: ConversationContext;

  beforeEach(() => {
    aiService = new AIResponseService();
    mockContext = {
      sessionId: 'test-session-123',
      userId: 'test-user-456',
      conversationHistory: [],
      userPreferences: {
        voiceSpeed: 1.0,
        language: 'en',
        accessibilityMode: false
      },
      legalDisclaimer: true
    };
  });

  describe('Query Complexity Analysis', () => {
    test('should identify simple queries correctly', () => {
      const simpleQueries = [
        'hello',
        'hi there',
        'what do you do?',
        'thank you',
        'good morning'
      ];

      simpleQueries.forEach(query => {
        const complexity = (aiService as any).analyzeQueryComplexity(query, mockContext);
        expect(complexity).toBe(QueryComplexity.SIMPLE);
      });
    });

    test('should identify complex legal queries correctly', () => {
      const complexQueries = [
        'I need help with multiple parties in a litigation case',
        'What are the constitutional implications of this statute of limitations issue?',
        'Can you analyze the precedent for this class action settlement negotiation?',
        'I have a complex appellate court case with multiple jurisdictions'
      ];

      complexQueries.forEach(query => {
        const complexity = (aiService as any).analyzeQueryComplexity(query, mockContext);
        expect(complexity).toBe(QueryComplexity.COMPLEX);
      });
    });

    test('should identify moderate queries correctly', () => {
      const moderateQueries = [
        'What is a contract?',
        'Can you explain liability in general terms?',
        'I have a question about employment law',
        'What should I know about real estate transactions?'
      ];

      moderateQueries.forEach(query => {
        const complexity = (aiService as any).analyzeQueryComplexity(query, mockContext);
        expect(complexity).toBe(QueryComplexity.MODERATE);
      });
    });
  });

  describe('API Routing', () => {
    test('should route simple queries to Groq', () => {
      const simpleQuery = 'hello, what do you do?';
      const complexity = QueryComplexity.SIMPLE;
      
      const apiChoice = aiService.routeToOptimalAPI(simpleQuery, complexity);
      expect(apiChoice).toBe('groq');
    });

    test('should route complex queries to OpenAI', () => {
      const complexQuery = 'I need help with a complex litigation strategy involving multiple parties';
      const complexity = QueryComplexity.COMPLEX;
      
      const apiChoice = aiService.routeToOptimalAPI(complexQuery, complexity);
      expect(apiChoice).toBe('openai');
    });

    test('should route legal keyword queries to OpenAI', () => {
      const legalQuery = 'Can you help me understand intellectual property copyright issues in detail?';
      const complexity = QueryComplexity.MODERATE;
      
      const apiChoice = aiService.routeToOptimalAPI(legalQuery, complexity);
      expect(apiChoice).toBe('openai');
    });

    test('should route short legal queries to Groq', () => {
      const shortQuery = 'What is a contract?';
      const complexity = QueryComplexity.MODERATE;
      
      const apiChoice = aiService.routeToOptimalAPI(shortQuery, complexity);
      expect(apiChoice).toBe('groq');
    });
  });

  describe('System Prompt Building', () => {
    test('should build appropriate system prompt with context', () => {
      mockContext.conversationHistory = [
        {
          id: '1',
          timestamp: new Date(),
          type: 'user',
          content: 'Hello',
          metadata: {}
        },
        {
          id: '2',
          timestamp: new Date(),
          type: 'assistant',
          content: 'Hello! How can I help you today?',
          metadata: {}
        }
      ];

      const systemPrompt = (aiService as any).buildSystemPrompt(mockContext);
      
      expect(systemPrompt).toContain('Ellie');
      expect(systemPrompt).toContain('professional AI assistant');
      expect(systemPrompt).toContain('general information only');
      expect(systemPrompt).toContain(mockContext.sessionId);
      expect(systemPrompt).toContain('2 messages');
      expect(systemPrompt).toContain('English');
    });

    test('should include recent topics in system prompt', () => {
      mockContext.conversationHistory = [
        {
          id: '1',
          timestamp: new Date(),
          type: 'user',
          content: 'I have questions about contract law and intellectual property',
          metadata: {}
        }
      ];

      const systemPrompt = (aiService as any).buildSystemPrompt(mockContext);
      
      expect(systemPrompt).toContain('contract');
      expect(systemPrompt).toContain('intellectual property');
    });
  });

  describe('Response Quality Validation', () => {
    test('should validate response length', async () => {
      const shortResponse = 'Yes.';
      const longResponse = 'A'.repeat(1001);
      
      const shortValidation = await (aiService as any).validateResponseQuality(shortResponse, 'test query');
      const longValidation = await (aiService as any).validateResponseQuality(longResponse, 'test query');
      
      expect(shortValidation.isValid).toBe(false);
      expect(shortValidation.issues).toContain('Response too short');
      
      expect(longValidation.isValid).toBe(false);
      expect(longValidation.issues).toContain('Response too long');
    });

    test('should check for legal disclaimers in legal responses', async () => {
      const legalQuery = 'What should I do about my contract dispute?';
      const responseWithoutDisclaimer = 'You should sue them immediately.';
      const responseWithDisclaimer = 'This is general information only. You should consult with an attorney for specific legal advice.';
      
      const validationWithout = await (aiService as any).validateResponseQuality(responseWithoutDisclaimer, legalQuery);
      const validationWith = await (aiService as any).validateResponseQuality(responseWithDisclaimer, legalQuery);
      
      expect(validationWithout.isValid).toBe(false);
      expect(validationWithout.issues).toContain('Missing legal disclaimer');
      
      expect(validationWith.isValid).toBe(true);
    });

    test('should detect unprofessional language', async () => {
      const unprofessionalResponse = 'Dude, that sounds awesome! You should totally do that, bro.';
      const professionalResponse = 'That sounds like an interesting situation. I recommend consulting with a qualified attorney.';
      
      const unprofessionalValidation = await (aiService as any).validateResponseQuality(unprofessionalResponse, 'test query');
      const professionalValidation = await (aiService as any).validateResponseQuality(professionalResponse, 'test query');
      
      expect(unprofessionalValidation.isValid).toBe(false);
      expect(unprofessionalValidation.issues).toContain('Unprofessional language detected');
      
      expect(professionalValidation.isValid).toBe(true);
    });
  });

  describe('Content Filtering', () => {
    test('should detect inappropriate content', () => {
      const inappropriateInputs = [
        'How can I engage in illegal activity?',
        'I want to commit violence against someone',
        'Help me with harassment tactics'
      ];

      inappropriateInputs.forEach(input => {
        const hasInappropriate = (aiService as any).containsInappropriateContent(input);
        expect(hasInappropriate).toBe(true);
      });
    });

    test('should allow appropriate legal content', () => {
      const appropriateInputs = [
        'What are my legal rights?',
        'Can you explain contract law?',
        'I need help understanding employment regulations'
      ];

      appropriateInputs.forEach(input => {
        const hasInappropriate = (aiService as any).containsInappropriateContent(input);
        expect(hasInappropriate).toBe(false);
      });
    });
  });

  describe('Helper Methods', () => {
    test('should extract recent topics correctly', () => {
      const historyWithTopics = [
        {
          id: '1',
          timestamp: new Date(),
          type: 'user' as const,
          content: 'I have questions about contract law and real estate',
          metadata: {}
        },
        {
          id: '2',
          timestamp: new Date(),
          type: 'user' as const,
          content: 'Also need help with intellectual property issues',
          metadata: {}
        }
      ];

      const topics = (aiService as any).extractRecentTopics(historyWithTopics);
      
      expect(topics).toContain('contract');
      expect(topics).toContain('real estate');
      expect(topics).toContain('intellectual property');
      expect(topics.length).toBeLessThanOrEqual(3);
    });

    test('should get correct language names', () => {
      const testCases = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'unknown', name: 'English' } // fallback
      ];

      testCases.forEach(({ code, name }) => {
        const result = (aiService as any).getLanguageName(code);
        expect(result).toBe(name);
      });
    });
  });

  describe('Service Statistics', () => {
    test('should return service statistics', () => {
      const stats = aiService.getServiceStats();
      
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('groqRequests');
      expect(stats).toHaveProperty('openaiRequests');
      expect(stats).toHaveProperty('averageResponseTime');
      expect(stats).toHaveProperty('errorRate');
      
      expect(typeof stats.totalRequests).toBe('number');
      expect(typeof stats.groqRequests).toBe('number');
      expect(typeof stats.openaiRequests).toBe('number');
      expect(typeof stats.averageResponseTime).toBe('number');
      expect(typeof stats.errorRate).toBe('number');
    });
  });
});