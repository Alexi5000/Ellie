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

      // Enhanced legal compliance validation
      const complianceResult = await this.legalComplianceService.analyzeLegalCompliance(
        response,
        userInput,
        context
      );

      if (!complianceResult.isCompliant) {
        console.warn('Legal compliance issues detected:', complianceResult.complianceIssues);
        response = complianceResult.suggestedResponse || this.handleFallbackResponses(new Error('Legal compliance violation'));
      }

      // Add professional referral information if needed
      if (complianceResult.requiresProfessionalReferral) {
        const disclaimer = this.legalComplianceService.generateLegalDisclaimer(context);
        response = `${response}\n\n${disclaimer}\n\nFor this matter, I recommend consulting with one of our qualified attorneys who can provide personalized legal guidance. Would you like me to help you schedule a consultation?`;
        
        // Store referral recommendation in metadata
        metadata.requiresProfessionalReferral = true;
        metadata.referralReason = complianceResult.referralReason;
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
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const conversationHistory = this.buildConversationHistory(context);

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

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response generated from Groq API');
      }

      return response.trim();

    } catch (error) {
      console.error('Groq API error:', error);
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
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const conversationHistory = this.buildConversationHistory(context);

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

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response generated from OpenAI API');
      }

      return response.trim();

    } catch (error) {
      console.error('OpenAI API error:', error);
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
    return `You are Ellie, a professional AI assistant for a law firm. Your role is to:

1. Provide helpful general information about legal topics
2. Direct visitors to appropriate legal services
3. Answer questions about the law firm's services and expertise
4. Maintain a professional, friendly, and approachable tone

IMPORTANT GUIDELINES:
- Never provide specific legal advice or legal opinions
- Always clarify that you provide general information only
- Encourage users to consult with attorneys for specific legal matters
- Be helpful while staying within appropriate boundaries
- If asked about complex legal matters, recommend speaking with an attorney

${this.LEGAL_DISCLAIMER}

Current conversation context:
- Session ID: ${context.sessionId}
- Legal disclaimer acknowledged: ${context.legalDisclaimer}
- Conversation length: ${context.conversationHistory.length} messages`;
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
}