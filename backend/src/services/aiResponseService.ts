/**
 * AI Response Service - Dual API routing with Groq and OpenAI integration
 * Requirements: 5.2, 6.1, 6.2, 6.3
 */

import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { ConversationContext, QueryComplexity, Message, MessageMetadata, ERROR_CODES } from '../types';
import { createErrorResponse, ErrorHandler } from '../utils/errorHandler';
import { LegalComplianceService } from './legalComplianceService';
import { cacheService } from './cacheService';
import { serviceDiscovery } from './serviceDiscovery';
import { loadBalancer } from './loadBalancer';
import { circuitBreakerManager } from './circuitBreaker';
import { logger } from './loggerService';

export class AIResponseService {
  private openai: OpenAI;
  private groq: Groq;
  private legalComplianceService: LegalComplianceService;
  private readonly LEGAL_DISCLAIMER = `
I'm Ellie, an AI assistant for this law firm. I provide general information only and cannot give specific legal advice. 
For legal matters requiring professional judgment, please consult with one of our attorneys directly.
`;

  private readonly LEGAL_COMPLIANCE_KEYWORDS = [
    'specific legal advice', 'legal representation', 'court case', 'lawsuit', 'legal strategy',
    'attorney-client privilege', 'confidential legal matter', 'legal opinion', 'legal counsel'
  ];

  private readonly INAPPROPRIATE_CONTENT_KEYWORDS = [
    'illegal activity', 'violence', 'harassment', 'discrimination', 'hate speech'
  ];

  constructor() {
    // Check if we're in test environment
    const isTestEnv = process.env.NODE_ENV === 'test';
    
    // In test environment, we need to validate that the test setup has provided keys
    if (isTestEnv) {
      // For tests, we expect the test setup to provide keys or we use defaults
      const openaiKey = process.env.OPENAI_API_KEY || 'test-openai-key';
      const groqKey = process.env.GROQ_API_KEY || 'test-groq-key';
      
      this.openai = new OpenAI({
        apiKey: openaiKey,
      });

      this.groq = new Groq({
        apiKey: groqKey,
      });
    } else {
      // Production environment - strict validation
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }
      
      if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY environment variable is required');
      }

      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      this.groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
    }

    this.legalComplianceService = new LegalComplianceService();
  }

  /**
   * Generates AI response using optimal API routing
   * @param userInput - User's input text
   * @param context - Conversation context
   * @returns Promise<string> - AI response
   */
  public async generateResponse(
    userInput: string,
    context: ConversationContext
  ): Promise<string> {
    const startTime = Date.now();

    // Validate input
    if (!userInput || userInput.trim().length === 0) {
      throw createErrorResponse(
        ERROR_CODES.INVALID_INPUT,
        'User input is required for AI response generation.',
        { userInput }
      );
    }

    // Check for inappropriate content
    if (this.containsInappropriateContent(userInput)) {
      throw createErrorResponse(
        ERROR_CODES.INAPPROPRIATE_CONTENT,
        'Content not appropriate for this service. Please modify your message.',
        { userInput: userInput.substring(0, 100) + '...' }
      );
    }

    try {
      // Check cache first for AI responses
      const cachedResponse = await cacheService.getCachedAIResponse(userInput, context);
      if (cachedResponse) {
        console.log('AI response cache hit');
        return cachedResponse;
      }

      // Determine query complexity and route to optimal API
      const complexity = this.analyzeQueryComplexity(userInput, context);
      const apiToUse = this.routeToOptimalAPI(userInput, complexity);

      let response: string;
      let metadata: MessageMetadata = {
        queryComplexity: complexity,
        apiUsed: apiToUse,
        processingTime: 0
      };

      // Generate response using selected API
      if (apiToUse === 'groq') {
        response = await this.processWithGroq(userInput, context);
      } else {
        response = await this.processWithOpenAI(userInput, context);
      }

      // Validate response quality
      const qualityValidation = await this.validateResponseQuality(response, userInput);
      if (!qualityValidation.isValid) {
        logger.warn('Response quality issues detected', {
          service: 'ai-response',
          metadata: {
            issues: qualityValidation.issues,
            improvements: qualityValidation.suggestedImprovements
          }
        });
      }

      // Enhanced legal compliance validation
      const complianceResult = await this.legalComplianceService.analyzeLegalCompliance(
        response,
        userInput,
        context
      );

      if (!complianceResult.isCompliant) {
        logger.warn('Legal compliance issues detected', {
          service: 'ai-response',
          metadata: {
            issues: complianceResult.complianceIssues,
            sessionId: context.sessionId
          }
        });
        
        response = complianceResult.suggestedResponse || this.handleFallbackResponses(new Error('Legal compliance violation'));
      }

      // Add professional referral information if needed
      if (complianceResult.requiresProfessionalReferral) {
        const disclaimer = this.legalComplianceService.generateLegalDisclaimer(context);
        response = `${response}\n\n${disclaimer}\n\nFor this matter, I recommend consulting with one of our qualified attorneys who can provide personalized legal guidance. Would you like me to help you schedule a consultation?`;
        
        // Store referral recommendation in metadata
        metadata.requiresProfessionalReferral = true;
        metadata.referralReason = complianceResult.referralReason;

        logger.info('Professional referral recommended', {
          service: 'ai-response',
          metadata: {
            sessionId: context.sessionId,
            reason: complianceResult.referralReason
          }
        });
      }

      metadata.processingTime = Date.now() - startTime;
      console.log(`AI response generated in ${metadata.processingTime}ms using ${apiToUse}`);

      // Cache the response for future use
      await cacheService.cacheAIResponse(userInput, context, response, {
        ttl: complexity === QueryComplexity.SIMPLE ? 7200 : 3600, // Cache simple responses longer
        language: context.userPreferences?.language || 'en'
      });

      return response;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('AI response generation failed:', error);

      // Return fallback response for any errors
      return this.handleFallbackResponses(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Routes query to optimal API based on complexity analysis
   * @param query - User query
   * @param complexity - Analyzed query complexity
   * @returns API to use ('groq' or 'openai')
   */
  public routeToOptimalAPI(query: string, complexity: QueryComplexity): 'groq' | 'openai' {
    // Use OpenAI for complex legal scenarios requiring higher accuracy
    if (complexity === QueryComplexity.COMPLEX) {
      return 'openai';
    }

    // Check for legal-specific keywords that might need OpenAI's better reasoning
    const legalKeywords = [
      'contract', 'agreement', 'liability', 'damages', 'negligence', 'breach',
      'intellectual property', 'copyright', 'trademark', 'patent', 'employment law',
      'real estate', 'estate planning', 'will', 'trust', 'probate', 'divorce',
      'custody', 'criminal law', 'civil rights', 'constitutional law'
    ];

    const hasLegalKeywords = legalKeywords.some(keyword => 
      query.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasLegalKeywords && query.length > 50) {
      return 'openai';
    }

    // Default to Groq for speed on simple and moderate queries
    return 'groq';
  }

  /**
   * Analyzes query complexity for API routing decisions
   * @param query - User query
   * @param context - Conversation context
   * @returns QueryComplexity level
   */
  private analyzeQueryComplexity(query: string, context: ConversationContext): QueryComplexity {
    const queryLower = query.toLowerCase();

    // Simple greetings and basic questions
    const simplePatterns = [
      /^(hi|hello|hey|good morning|good afternoon|good evening)/,
      /^(how are you|what's your name|who are you)/,
      /^(thank you|thanks|bye|goodbye)/,
      /^(yes|no|okay|ok)$/,
      /what (do you do|services)/
    ];

    if (simplePatterns.some(pattern => pattern.test(queryLower)) || query.length < 20) {
      return QueryComplexity.SIMPLE;
    }

    // Complex legal scenarios
    const complexIndicators = [
      'multiple parties', 'litigation', 'court proceedings', 'legal strategy',
      'case analysis', 'precedent', 'jurisdiction', 'statute of limitations',
      'constitutional', 'appellate', 'class action', 'settlement negotiation'
    ];

    const hasComplexIndicators = complexIndicators.some(indicator => 
      queryLower.includes(indicator)
    );

    const hasMultipleQuestions = (query.match(/\?/g) || []).length > 1;
    const isLongQuery = query.length > 200;
    const hasLegalJargon = /\b(whereas|heretofore|pursuant|notwithstanding|aforementioned)\b/i.test(query);

    if (hasComplexIndicators || (hasMultipleQuestions && isLongQuery) || hasLegalJargon) {
      return QueryComplexity.COMPLEX;
    }

    // Default to moderate for general legal information
    return QueryComplexity.MODERATE;
  }

  /**
   * Processes query using Groq API for fast inference
   * @param userInput - User input
   * @param context - Conversation context
   * @returns Promise<string> - AI response
   */
  public async processWithGroq(
    userInput: string,
    context: ConversationContext
  ): Promise<string> {
    const startTime = Date.now();
    
    try {
      // Use circuit breaker for external API calls
      const response = await circuitBreakerManager.execute(
        'groq_api',
        async () => {
          const systemPrompt = this.buildSystemPrompt(context);
          const conversationHistory = this.buildConversationHistory(context);

          logger.debug('Calling Groq API', {
            service: 'ai-response',
            metadata: {
              model: 'llama3-8b-8192',
              inputLength: userInput.length,
              historyLength: conversationHistory.length
            }
          });

          const completion = await this.groq.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              ...conversationHistory,
              { role: 'user', content: userInput }
            ],
            model: 'llama3-8b-8192', // Fast Groq model
            temperature: 0.7,
            max_tokens: 500,
            top_p: 0.9,
            stream: false
          });

          const responseContent = completion.choices[0]?.message?.content;
          if (!responseContent) {
            throw new Error('No response generated from Groq API');
          }

          return responseContent.trim();
        }
      );

      const processingTime = Date.now() - startTime;
      logger.info('Groq API response generated successfully', {
        service: 'ai-response',
        metadata: {
          processingTime,
          responseLength: response.length,
          model: 'llama3-8b-8192'
        }
      });

      return response;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Groq API error', {
        service: 'ai-response',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        },
        metadata: {
          processingTime,
          inputLength: userInput.length
        }
      });

      throw ErrorHandler.handleApiError(error);
    }
  }

  /**
   * Processes query using OpenAI API for complex scenarios
   * @param userInput - User input
   * @param context - Conversation context
   * @returns Promise<string> - AI response
   */
  public async processWithOpenAI(
    userInput: string,
    context: ConversationContext
  ): Promise<string> {
    const startTime = Date.now();
    
    try {
      // Use circuit breaker for external API calls
      const response = await circuitBreakerManager.execute(
        'openai_api',
        async () => {
          const systemPrompt = this.buildSystemPrompt(context);
          const conversationHistory = this.buildConversationHistory(context);

          logger.debug('Calling OpenAI API', {
            service: 'ai-response',
            metadata: {
              model: 'gpt-3.5-turbo',
              inputLength: userInput.length,
              historyLength: conversationHistory.length
            }
          });

          const completion = await this.openai.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              ...conversationHistory,
              { role: 'user', content: userInput }
            ],
            model: 'gpt-3.5-turbo', // Balanced cost and performance
            temperature: 0.6,
            max_tokens: 600,
            top_p: 0.9,
            frequency_penalty: 0.1,
            presence_penalty: 0.1
          });

          const responseContent = completion.choices[0]?.message?.content;
          if (!responseContent) {
            throw new Error('No response generated from OpenAI API');
          }

          return responseContent.trim();
        }
      );

      const processingTime = Date.now() - startTime;
      logger.info('OpenAI API response generated successfully', {
        service: 'ai-response',
        metadata: {
          processingTime,
          responseLength: response.length,
          model: 'gpt-3.5-turbo'
        }
      });

      return response;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('OpenAI API error', {
        service: 'ai-response',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        },
        metadata: {
          processingTime,
          inputLength: userInput.length
        }
      });

      throw ErrorHandler.handleApiError(error);
    }
  }

  /**
   * Validates response for legal compliance
   * @param response - AI generated response
   * @returns Promise<boolean> - Whether response is compliant
   */
  public async validateLegalCompliance(response: string): Promise<boolean> {
    const responseLower = response.toLowerCase();

    // Check for prohibited legal advice patterns
    const prohibitedPatterns = [
      /you should (sue|file a lawsuit|take legal action)/,
      /i recommend (hiring|firing|terminating)/,
      /this is definitely (legal|illegal|a violation)/,
      /you have a strong case/,
      /you will (win|lose) in court/,
      /the statute of limitations (has|hasn't) expired/,
      /you are (liable|not liable) for/
    ];

    const hasProhibitedContent = prohibitedPatterns.some(pattern => 
      pattern.test(responseLower)
    );

    if (hasProhibitedContent) {
      return false;
    }

    // Check for appropriate disclaimers in legal responses
    const isLegalTopic = this.LEGAL_COMPLIANCE_KEYWORDS.some(keyword => 
      responseLower.includes(keyword.toLowerCase())
    );

    if (isLegalTopic && !responseLower.includes('general information')) {
      return false;
    }

    return true;
  }

  /**
   * Handles fallback responses for service failures
   * @param error - Error that occurred
   * @returns Fallback response string
   */
  public handleFallbackResponses(error: Error): string {
    return ErrorHandler.createFallbackResponse(error);
  }

  /**
   * Builds system prompt for AI models
   * @param context - Conversation context
   * @returns System prompt string
   */
  private buildSystemPrompt(context: ConversationContext): string {
    const userLanguage = context.userPreferences?.language || 'en';
    const currentTime = new Date().toLocaleString();
    
    // Build dynamic context based on conversation history
    const recentTopics = this.extractRecentTopics(context.conversationHistory);
    const topicsContext = recentTopics.length > 0 
      ? `\nRecent conversation topics: ${recentTopics.join(', ')}`
      : '';

    return `You are Ellie, a professional AI assistant for a law firm. Your role is to:

1. Provide helpful general information about legal topics
2. Direct visitors to appropriate legal services  
3. Answer questions about the law firm's services and expertise
4. Maintain a professional, friendly, and approachable tone
5. Respond in ${userLanguage === 'en' ? 'English' : this.getLanguageName(userLanguage)}

CRITICAL GUIDELINES:
- NEVER provide specific legal advice or legal opinions
- ALWAYS clarify that you provide general information only
- Encourage users to consult with attorneys for specific legal matters
- Be helpful while staying within appropriate boundaries
- If asked about complex legal matters, recommend speaking with an attorney
- Keep responses concise but informative (aim for 2-3 sentences for simple queries)
- Use a warm, professional tone that builds trust

LEGAL COMPLIANCE:
${this.LEGAL_DISCLAIMER}

CURRENT CONTEXT:
- Session ID: ${context.sessionId}
- Legal disclaimer acknowledged: ${context.legalDisclaimer}
- Conversation length: ${context.conversationHistory.length} messages
- Current time: ${currentTime}
- User language preference: ${userLanguage}${topicsContext}

Remember: Your goal is to be helpful while ensuring users get proper professional legal guidance when needed.`;
  }

  /**
   * Builds conversation history for context
   * @param context - Conversation context
   * @returns Array of message objects for API
   */
  private buildConversationHistory(context: ConversationContext): Array<{role: 'user' | 'assistant', content: string}> {
    // Include last 5 messages for context (to stay within token limits)
    const recentMessages = context.conversationHistory.slice(-5);
    
    return recentMessages.map(msg => ({
      role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));
  }

  /**
   * Checks for inappropriate content in user input
   * @param input - User input to check
   * @returns Whether input contains inappropriate content
   */
  private containsInappropriateContent(input: string): boolean {
    const inputLower = input.toLowerCase();
    
    return this.INAPPROPRIATE_CONTENT_KEYWORDS.some(keyword => 
      inputLower.includes(keyword.toLowerCase())
    );
  }

  /**
   * Extracts recent topics from conversation history for context
   * @param history - Conversation history
   * @returns Array of recent topics
   */
  private extractRecentTopics(history: Message[]): string[] {
    const topics = new Set<string>();
    const recentMessages = history.slice(-6); // Last 6 messages
    
    const legalTopics = [
      'contract', 'agreement', 'liability', 'damages', 'negligence', 'breach',
      'intellectual property', 'copyright', 'trademark', 'patent', 'employment',
      'real estate', 'estate planning', 'will', 'trust', 'probate', 'divorce',
      'custody', 'criminal', 'civil rights', 'constitutional', 'business law',
      'personal injury', 'medical malpractice', 'insurance', 'bankruptcy'
    ];

    recentMessages.forEach(message => {
      const messageLower = message.content.toLowerCase();
      legalTopics.forEach(topic => {
        if (messageLower.includes(topic)) {
          topics.add(topic);
        }
      });
    });

    return Array.from(topics).slice(0, 3); // Return max 3 topics
  }

  /**
   * Gets language name from language code
   * @param languageCode - ISO language code
   * @returns Language name
   */
  private getLanguageName(languageCode: string): string {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'ru': 'Russian'
    };

    return languageNames[languageCode] || 'English';
  }

  /**
   * Gets service statistics for monitoring
   * @returns Service statistics
   */
  public getServiceStats(): {
    totalRequests: number;
    groqRequests: number;
    openaiRequests: number;
    averageResponseTime: number;
    errorRate: number;
  } {
    // In a production environment, these would be tracked in memory or database
    // For now, return placeholder values
    return {
      totalRequests: 0,
      groqRequests: 0,
      openaiRequests: 0,
      averageResponseTime: 0,
      errorRate: 0
    };
  }

  /**
   * Validates AI response quality and appropriateness
   * @param response - AI generated response
   * @param userInput - Original user input
   * @returns Validation result
   */
  private async validateResponseQuality(response: string, userInput: string): Promise<{
    isValid: boolean;
    issues: string[];
    suggestedImprovements: string[];
  }> {
    const issues: string[] = [];
    const suggestedImprovements: string[] = [];

    // Check response length
    if (response.length < 10) {
      issues.push('Response too short');
      suggestedImprovements.push('Provide more detailed information');
    }

    if (response.length > 1000) {
      issues.push('Response too long');
      suggestedImprovements.push('Make response more concise');
    }

    // Check for appropriate legal disclaimers
    const isLegalQuery = this.isLegalQuery(userInput);
    if (isLegalQuery && !this.hasLegalDisclaimer(response)) {
      issues.push('Missing legal disclaimer');
      suggestedImprovements.push('Add appropriate legal disclaimer');
    }

    // Check for professional tone
    const unprofessionalWords = ['dude', 'bro', 'awesome', 'cool', 'whatever'];
    const hasUnprofessionalLanguage = unprofessionalWords.some(word => 
      response.toLowerCase().includes(word)
    );

    if (hasUnprofessionalLanguage) {
      issues.push('Unprofessional language detected');
      suggestedImprovements.push('Use more professional language');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestedImprovements
    };
  }

  /**
   * Checks if user input is a legal query
   * @param input - User input
   * @returns Whether input is legal-related
   */
  private isLegalQuery(input: string): boolean {
    const legalKeywords = [
      'law', 'legal', 'attorney', 'lawyer', 'court', 'judge', 'contract',
      'agreement', 'liability', 'damages', 'sue', 'lawsuit', 'rights',
      'violation', 'breach', 'negligence', 'fraud', 'criminal', 'civil'
    ];

    const inputLower = input.toLowerCase();
    return legalKeywords.some(keyword => inputLower.includes(keyword));
  }

  /**
   * Checks if response contains legal disclaimer
   * @param response - Response to check
   * @returns Whether response has disclaimer
   */
  private hasLegalDisclaimer(response: string): boolean {
    const disclaimerIndicators = [
      'general information', 'not legal advice', 'consult with an attorney',
      'professional legal advice', 'qualified attorney', 'legal professional'
    ];

    const responseLower = response.toLowerCase();
    return disclaimerIndicators.some(indicator => responseLower.includes(indicator));
  }
}

// Export singleton instance
export const aiResponseService = new AIResponseService();