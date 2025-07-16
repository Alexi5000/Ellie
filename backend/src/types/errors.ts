/**
 * Error handling TypeScript interfaces and constants
 * Requirements: 5.4, 7.4
 */

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
    requestId: string;
  };
}

export const ERROR_CODES = {
  // Audio processing errors
  AUDIO_PROCESSING_FAILED: 'AUDIO_PROCESSING_FAILED',
  INVALID_AUDIO_FORMAT: 'INVALID_AUDIO_FORMAT',
  AUDIO_TOO_LARGE: 'AUDIO_TOO_LARGE',
  MICROPHONE_PERMISSION_DENIED: 'MICROPHONE_PERMISSION_DENIED',
  
  // API errors
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  API_KEY_INVALID: 'API_KEY_INVALID',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  WEBSOCKET_CONNECTION_FAILED: 'WEBSOCKET_CONNECTION_FAILED',
  
  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Server errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Legal compliance errors
  LEGAL_COMPLIANCE_VIOLATION: 'LEGAL_COMPLIANCE_VIOLATION',
  INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];