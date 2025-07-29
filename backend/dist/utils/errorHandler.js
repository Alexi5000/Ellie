"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = void 0;
exports.createErrorResponse = createErrorResponse;
const errors_1 = require("../types/errors");
const uuid_1 = require("uuid");
class ErrorHandler {
    static createErrorResponse(code, message, details, requestId) {
        return {
            error: {
                code,
                message,
                details,
                timestamp: new Date(),
                requestId: requestId || (0, uuid_1.v4)()
            }
        };
    }
    static formatUserMessage(code) {
        const userMessages = {
            [errors_1.ERROR_CODES.AUDIO_PROCESSING_FAILED]: 'Unable to process your audio. Please try speaking again.',
            [errors_1.ERROR_CODES.INVALID_AUDIO_FORMAT]: 'Audio format not supported. Please use a different recording method.',
            [errors_1.ERROR_CODES.AUDIO_TOO_LARGE]: 'Audio file is too large. Please keep recordings under 10MB.',
            [errors_1.ERROR_CODES.MICROPHONE_PERMISSION_DENIED]: 'Microphone access is required. Please enable microphone permissions.',
            [errors_1.ERROR_CODES.EXTERNAL_API_ERROR]: 'Our AI service is temporarily unavailable. Please try again in a moment.',
            [errors_1.ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment before trying again.',
            [errors_1.ERROR_CODES.API_KEY_INVALID]: 'Service configuration error. Please contact support.',
            [errors_1.ERROR_CODES.NETWORK_ERROR]: 'Network connection issue. Please check your internet connection.',
            [errors_1.ERROR_CODES.CONNECTION_TIMEOUT]: 'Request timed out. Please try again.',
            [errors_1.ERROR_CODES.WEBSOCKET_CONNECTION_FAILED]: 'Real-time connection failed. Please refresh the page.',
            [errors_1.ERROR_CODES.INVALID_INPUT]: 'Invalid input provided. Please check your request.',
            [errors_1.ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Required information is missing. Please complete all fields.',
            [errors_1.ERROR_CODES.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred. Please try again later.',
            [errors_1.ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',
            [errors_1.ERROR_CODES.LEGAL_COMPLIANCE_VIOLATION]: 'Request violates legal compliance policies.',
            [errors_1.ERROR_CODES.INAPPROPRIATE_CONTENT]: 'Content not appropriate for this service.',
            [errors_1.ERROR_CODES.REFERRAL_PROCESSING_FAILED]: 'Failed to process professional referral request. Please try again.',
            [errors_1.ERROR_CODES.PRIVACY_UPDATE_FAILED]: 'Failed to update privacy settings. Please try again.',
            [errors_1.ERROR_CODES.PRIVACY_RETRIEVAL_FAILED]: 'Failed to retrieve privacy settings. Please try again.',
            [errors_1.ERROR_CODES.LOGGING_FAILED]: 'Failed to log conversation data. Please try again.',
            [errors_1.ERROR_CODES.DELETION_FAILED]: 'Failed to delete data. Please try again.',
            [errors_1.ERROR_CODES.EXPORT_FAILED]: 'Failed to export user data. Please try again.',
            [errors_1.ERROR_CODES.DISCLAIMER_GENERATION_FAILED]: 'Failed to generate legal disclaimer. Please try again.',
            [errors_1.ERROR_CODES.NOT_FOUND]: 'Requested resource not found.'
        };
        return userMessages[code] || 'An unexpected error occurred. Please try again.';
    }
    static isValidErrorCode(code) {
        return Object.values(errors_1.ERROR_CODES).includes(code);
    }
    static handleApiError(error, requestId) {
        if (error.response?.status === 429) {
            return this.createErrorResponse(errors_1.ERROR_CODES.RATE_LIMIT_EXCEEDED, this.formatUserMessage(errors_1.ERROR_CODES.RATE_LIMIT_EXCEEDED), { retryAfter: error.response.headers['retry-after'] }, requestId);
        }
        if (error.response?.status === 401) {
            return this.createErrorResponse(errors_1.ERROR_CODES.API_KEY_INVALID, this.formatUserMessage(errors_1.ERROR_CODES.API_KEY_INVALID), undefined, requestId);
        }
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            return this.createErrorResponse(errors_1.ERROR_CODES.CONNECTION_TIMEOUT, this.formatUserMessage(errors_1.ERROR_CODES.CONNECTION_TIMEOUT), undefined, requestId);
        }
        return this.createErrorResponse(errors_1.ERROR_CODES.EXTERNAL_API_ERROR, this.formatUserMessage(errors_1.ERROR_CODES.EXTERNAL_API_ERROR), { originalError: error.message }, requestId);
    }
    static createFallbackResponse(error) {
        const fallbackMessages = [
            "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment, or feel free to contact our office directly for immediate assistance.",
            "I'm currently unable to process your request due to a temporary service issue. Our team has been notified and is working to resolve this quickly.",
            "There seems to be a technical issue on our end. While we work to fix this, you can reach out to our office directly for any urgent legal questions."
        ];
        return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
    }
}
exports.ErrorHandler = ErrorHandler;
function createErrorResponse(code, message, details, requestId) {
    return ErrorHandler.createErrorResponse(code, message, details, requestId);
}
//# sourceMappingURL=errorHandler.js.map