/**
 * Error validation and formatting utilities
 * Requirements: 5.4, 7.4
 */

import { ErrorResponse, ErrorCode, ERROR_CODES } from '../types/errors';
import { v4 as uuidv4 } from 'uuid';

export class ErrorHandler {
  /**
   * Creates a standardized error response
   */
  static createErrorResponse(
    code: ErrorCode,
    message: string,
    details?: any,
    requestId?: string
  ): ErrorResponse {
    return {
      error: {
        code,
        message,
        details,
        timestamp: new Date(),
        requestId: requestId || uuidv4()
      }
    };
  }

  /**
   * Formats error messages for user-friendly display
   */
  static formatUserMessage(code: ErrorCode): string {
    const userMessages: Record<ErrorCode, string> = {
      [ERROR_CODES.AUDIO_PROCESSING_FAILED]: 'Unable to process your audio. Please try speaking again.',
      [ERROR_CODES.INVALID_AUDIO_FORMAT]: 'Audio format not supported. Please use a different recording method.',
      [ERROR_CODES.AUDIO_TOO_LARGE]: 'Audio file is too large. Please keep recordings under 10MB.',
      [ERROR_CODES.MICROPHONE_PERMISSION_DENIED]: 'Microphone access is required. Please enable microphone permissions.',
      [ERROR_CODES.EXTERNAL_API_ERROR]: 'Our AI service is temporarily unavailable. Please try again in a moment.',
      [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment before trying again.',
      [ERROR_CODES.API_KEY_INVALID]: 'Service configuration error. Please contact support.',
      [ERROR_CODES.NETWORK_ERROR]: 'Network connection issue. Please check your internet connection.',
      [ERROR_CODES.CONNECTION_TIMEOUT]: 'Request timed out. Please try again.',
      [ERROR_CODES.WEBSOCKET_CONNECTION_FAILED]: 'Real-time connection failed. Please refresh the page.',
      [ERROR_CODES.INVALID_INPUT]: 'Invalid input provided. Please check your request.',
      [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Required information is missing. Please complete all fields.',
      [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred. Please try again later.',
      [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',
      [ERROR_CODES.LEGAL_COMPLIANCE_VIOLATION]: 'Request violates legal compliance policies.',
      [ERROR_CODES.INAPPROPRIATE_CONTENT]: 'Content not appropriate for this service.',
      [ERROR_CODES.REFERRAL_PROCESSING_FAILED]: 'Failed to process professional referral request. Please try again.',
      [ERROR_CODES.PRIVACY_UPDATE_FAILED]: 'Failed to update privacy settings. Please try again.',
      [ERROR_CODES.PRIVACY_RETRIEVAL_FAILED]: 'Failed to retrieve privacy settings. Please try again.',
      [ERROR_CODES.LOGGING_FAILED]: 'Failed to log conversation data. Please try again.',
      [ERROR_CODES.DELETION_FAILED]: 'Failed to delete data. Please try again.',
      [ERROR_CODES.EXPORT_FAILED]: 'Failed to export user data. Please try again.',
      [ERROR_CODES.DISCLAIMER_GENERATION_FAILED]: 'Failed to generate legal disclaimer. Please try again.',
      [ERROR_CODES.NOT_FOUND]: 'Requested resource not found.'
    };

    return userMessages[code] || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Validates if an error code is valid
   */
  static isValidErrorCode(code: string): code is ErrorCode {
    return Object.values(ERROR_CODES).includes(code as ErrorCode);
  }

  /**
   * Creates error response for API failures with fallback messages
   */
  static handleApiError(error: any, requestId?: string): ErrorResponse {
    if (error.response?.status === 429) {
      return this.createErrorResponse(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        this.formatUserMessage(ERROR_CODES.RATE_LIMIT_EXCEEDED),
        { retryAfter: error.response.headers['retry-after'] },
        requestId
      );
    }

    if (error.response?.status === 401) {
      return this.createErrorResponse(
        ERROR_CODES.API_KEY_INVALID,
        this.formatUserMessage(ERROR_CODES.API_KEY_INVALID),
        undefined,
        requestId
      );
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return this.createErrorResponse(
        ERROR_CODES.CONNECTION_TIMEOUT,
        this.formatUserMessage(ERROR_CODES.CONNECTION_TIMEOUT),
        undefined,
        requestId
      );
    }

    return this.createErrorResponse(
      ERROR_CODES.EXTERNAL_API_ERROR,
      this.formatUserMessage(ERROR_CODES.EXTERNAL_API_ERROR),
      { originalError: error.message },
      requestId
    );
  }

  /**
   * Creates fallback response for service failures
   */
  static createFallbackResponse(error: Error): string {
    const fallbackMessages = [
      "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment, or feel free to contact our office directly for immediate assistance.",
      "I'm currently unable to process your request due to a temporary service issue. Our team has been notified and is working to resolve this quickly.",
      "There seems to be a technical issue on our end. While we work to fix this, you can reach out to our office directly for any urgent legal questions."
    ];

    // Return a random fallback message
    return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
  }
}

/**
 * Standalone function for creating error responses
 * Used by services that need to create error responses
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: any,
  requestId?: string
): ErrorResponse {
  return ErrorHandler.createErrorResponse(code, message, details, requestId);
}