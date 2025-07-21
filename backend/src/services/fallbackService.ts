/**
 * Fallback response service for external service failures
 * Requirements: 5.4, 5.5
 */

import { logger } from './loggerService';
import { ErrorCode, ERROR_CODES } from '../types/errors';

export interface FallbackResponse {
  text: string;
  audioUrl?: string;
  confidence: number;
  processingTime: number;
  isFallback: true;
  fallbackReason: string;
}

export interface ServiceStatus {
  isAvailable: boolean;
  lastChecked: Date;
  consecutiveFailures: number;
  averageResponseTime: number;
  errorRate: number;
}

export class FallbackService {
  private static instance: FallbackService;
  private serviceStatus = new Map<string, ServiceStatus>();
  private fallbackResponses: Record<string, string[]> = {};
  private circuitBreakerThreshold = 5; // Failures before circuit opens
  private circuitBreakerTimeout = 60000; // 1 minute before retry

  private constructor() {
    this.initializeFallbackResponses();
    this.initializeServiceStatus();
  }

  static getInstance(): FallbackService {
    if (!FallbackService.instance) {
      FallbackService.instance = new FallbackService();
    }
    return FallbackService.instance;
  }

  /**
   * Initialize fallback responses for different scenarios
   */
  private initializeFallbackResponses() {
    this.fallbackResponses = {
      greeting: [
        "Hello! I'm Ellie, your AI legal assistant. I'm here to help answer your questions about our legal services. How can I assist you today?",
        "Hi there! Welcome to our law firm. I'm Ellie, and I'm here to help you with information about our legal services. What can I help you with?",
        "Good day! I'm Ellie, your virtual legal receptionist. I'm ready to assist you with questions about our practice areas and services. How may I help you?"
      ],
      
      generalInquiry: [
        "I'd be happy to help you with information about our legal services. Our firm specializes in various practice areas, and I can connect you with the right attorney for your needs.",
        "Thank you for your inquiry. While I'm experiencing some technical difficulties, I can still provide general information about our legal services. What specific area of law are you interested in?",
        "I appreciate your question. Although I'm having some connectivity issues, I can share that our experienced attorneys handle a wide range of legal matters. Would you like me to connect you with someone from our team?"
      ],
      
      technicalDifficulty: [
        "I apologize, but I'm experiencing some technical difficulties right now. Please try again in a moment, or feel free to contact our office directly for immediate assistance.",
        "I'm currently unable to process your request due to a temporary service issue. Our team has been notified and is working to resolve this quickly. You can reach our office directly if you need immediate help.",
        "There seems to be a technical issue on our end. While we work to fix this, you can contact our office directly for any urgent legal questions or to schedule a consultation."
      ],
      
      serviceUnavailable: [
        "Our AI service is temporarily unavailable, but I want to ensure you get the help you need. Please contact our office directly, and one of our team members will be happy to assist you.",
        "I'm experiencing connectivity issues with our main systems. For immediate assistance with your legal questions, please call our office directly or visit our website for contact information.",
        "While our AI systems are temporarily down, our human team is still available to help. Please don't hesitate to contact our office directly for any legal assistance you need."
      ],
      
      legalDisclaimer: [
        "Please note that I provide general information only and cannot give specific legal advice. For personalized legal guidance, I recommend speaking with one of our qualified attorneys.",
        "I want to remind you that our conversation provides general information and should not be considered legal advice. For specific legal matters, please consult with one of our licensed attorneys.",
        "This information is for general purposes only and doesn't constitute legal advice. For advice specific to your situation, please schedule a consultation with one of our attorneys."
      ],
      
      complexQuestion: [
        "That's an excellent question that requires the expertise of one of our attorneys. I'd be happy to connect you with the right legal professional who can provide you with detailed guidance.",
        "Your question involves complex legal considerations that are best addressed by one of our experienced attorneys. Would you like me to help you schedule a consultation?",
        "This is the type of important legal question that deserves the attention of one of our qualified attorneys. I can help arrange for you to speak with the right legal expert."
      ],
      
      offTopic: [
        "I'm here to help with questions about our legal services and practice areas. Is there something specific about our legal services I can assist you with?",
        "I focus on providing information about our law firm's services and legal practice areas. How can I help you with your legal needs today?",
        "I'm designed to assist with questions about our legal services. What legal matter can I help you with today?"
      ]
    };
  }

  /**
   * Initialize service status tracking
   */
  private initializeServiceStatus() {
    const services = ['openai-whisper', 'openai-tts', 'openai-gpt', 'groq'];
    
    services.forEach(service => {
      this.serviceStatus.set(service, {
        isAvailable: true,
        lastChecked: new Date(),
        consecutiveFailures: 0,
        averageResponseTime: 0,
        errorRate: 0
      });
    });
  }

  /**
   * Record service call result
   */
  recordServiceCall(
    service: string,
    success: boolean,
    responseTime: number,
    error?: Error
  ) {
    const status = this.serviceStatus.get(service);
    if (!status) return;

    status.lastChecked = new Date();
    
    if (success) {
      status.consecutiveFailures = 0;
      status.isAvailable = true;
    } else {
      status.consecutiveFailures++;
      
      // Circuit breaker logic
      if (status.consecutiveFailures >= this.circuitBreakerThreshold) {
        status.isAvailable = false;
        
        logger.error(`Service circuit breaker opened for ${service}`, {
          service: 'fallback-service',
          metadata: {
            serviceName: service,
            consecutiveFailures: status.consecutiveFailures,
            threshold: this.circuitBreakerThreshold
          },
          error: error ? {
            message: error.message,
            stack: error.stack
          } : undefined
        });

        // Schedule retry
        setTimeout(() => {
          this.resetCircuitBreaker(service);
        }, this.circuitBreakerTimeout);
      }
    }

    // Update average response time (simple moving average)
    status.averageResponseTime = (status.averageResponseTime + responseTime) / 2;
    
    this.serviceStatus.set(service, status);
  }

  /**
   * Reset circuit breaker for a service
   */
  private resetCircuitBreaker(service: string) {
    const status = this.serviceStatus.get(service);
    if (status) {
      status.isAvailable = true;
      status.consecutiveFailures = 0;
      
      logger.info(`Service circuit breaker reset for ${service}`, {
        service: 'fallback-service',
        metadata: { serviceName: service }
      });
    }
  }

  /**
   * Check if service is available
   */
  isServiceAvailable(service: string): boolean {
    const status = this.serviceStatus.get(service);
    return status ? status.isAvailable : false;
  }

  /**
   * Get fallback response for speech-to-text failure
   */
  getFallbackForTranscription(error: Error, requestId: string): FallbackResponse {
    logger.warn('Using fallback for transcription failure', {
      requestId,
      service: 'fallback-service',
      error: {
        message: error.message,
        stack: error.stack
      }
    });

    return {
      text: this.getRandomResponse('technicalDifficulty'),
      confidence: 0.5,
      processingTime: 100,
      isFallback: true,
      fallbackReason: 'Speech-to-text service unavailable'
    };
  }

  /**
   * Get fallback response for AI service failure
   */
  getFallbackForAI(userInput: string, error: Error, requestId: string): FallbackResponse {
    logger.warn('Using fallback for AI service failure', {
      requestId,
      service: 'fallback-service',
      metadata: { userInput: userInput.substring(0, 100) },
      error: {
        message: error.message,
        stack: error.stack
      }
    });

    // Determine appropriate fallback based on input
    let responseCategory = 'technicalDifficulty';
    
    const lowerInput = userInput.toLowerCase();
    if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
      responseCategory = 'greeting';
    } else if (lowerInput.includes('legal') || lowerInput.includes('law') || lowerInput.includes('attorney')) {
      responseCategory = 'generalInquiry';
    } else if (lowerInput.length > 200) {
      responseCategory = 'complexQuestion';
    }

    return {
      text: this.getRandomResponse(responseCategory),
      confidence: 0.3,
      processingTime: 50,
      isFallback: true,
      fallbackReason: 'AI service unavailable'
    };
  }

  /**
   * Get fallback response for text-to-speech failure
   */
  getFallbackForTTS(text: string, error: Error, requestId: string): FallbackResponse {
    logger.warn('Using fallback for TTS failure', {
      requestId,
      service: 'fallback-service',
      metadata: { textLength: text.length },
      error: {
        message: error.message,
        stack: error.stack
      }
    });

    return {
      text,
      confidence: 1.0, // Text is still accurate
      processingTime: 10,
      isFallback: true,
      fallbackReason: 'Text-to-speech service unavailable'
    };
  }

  /**
   * Get contextual fallback response
   */
  getContextualFallback(
    context: 'greeting' | 'inquiry' | 'complex' | 'offtopic' | 'error',
    requestId: string,
    additionalInfo?: string
  ): FallbackResponse {
    const categoryMap = {
      greeting: 'greeting',
      inquiry: 'generalInquiry',
      complex: 'complexQuestion',
      offtopic: 'offTopic',
      error: 'technicalDifficulty'
    };

    const category = categoryMap[context];
    let response = this.getRandomResponse(category);

    // Add legal disclaimer for legal-related contexts
    if (context === 'inquiry' || context === 'complex') {
      response += ' ' + this.getRandomResponse('legalDisclaimer');
    }

    logger.info('Generated contextual fallback response', {
      requestId,
      service: 'fallback-service',
      metadata: {
        context,
        category,
        additionalInfo
      }
    });

    return {
      text: response,
      confidence: 0.7,
      processingTime: 25,
      isFallback: true,
      fallbackReason: `Contextual fallback for ${context}`
    };
  }

  /**
   * Get random response from category
   */
  private getRandomResponse(category: string): string {
    const responses = this.fallbackResponses[category];
    if (!responses || responses.length === 0) {
      return "I apologize, but I'm experiencing technical difficulties. Please contact our office directly for assistance.";
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Get service health status
   */
  getServiceHealth(): Record<string, ServiceStatus> {
    const health: Record<string, ServiceStatus> = {};
    
    for (const [service, status] of this.serviceStatus.entries()) {
      health[service] = { ...status };
    }
    
    return health;
  }

  /**
   * Get fallback statistics
   */
  getFallbackStats(): {
    totalFallbacks: number;
    fallbacksByService: Record<string, number>;
    serviceAvailability: Record<string, boolean>;
    averageResponseTimes: Record<string, number>;
  } {
    // This would typically be tracked over time
    // For now, return current service status
    const stats = {
      totalFallbacks: 0,
      fallbacksByService: {} as Record<string, number>,
      serviceAvailability: {} as Record<string, boolean>,
      averageResponseTimes: {} as Record<string, number>
    };

    for (const [service, status] of this.serviceStatus.entries()) {
      stats.serviceAvailability[service] = status.isAvailable;
      stats.averageResponseTimes[service] = status.averageResponseTime;
      stats.fallbacksByService[service] = status.consecutiveFailures;
      stats.totalFallbacks += status.consecutiveFailures;
    }

    return stats;
  }

  /**
   * Add custom fallback responses
   */
  addCustomFallbackResponses(category: string, responses: string[]) {
    if (!this.fallbackResponses[category]) {
      this.fallbackResponses[category] = [];
    }
    this.fallbackResponses[category].push(...responses);
  }

  /**
   * Update circuit breaker settings
   */
  updateCircuitBreakerSettings(threshold: number, timeout: number) {
    this.circuitBreakerThreshold = threshold;
    this.circuitBreakerTimeout = timeout;
    
    logger.info('Circuit breaker settings updated', {
      service: 'fallback-service',
      metadata: { threshold, timeout }
    });
  }
}

export const fallbackService = FallbackService.getInstance();