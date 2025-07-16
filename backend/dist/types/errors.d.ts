export interface ErrorResponse {
    error: {
        code: string;
        message: string;
        details?: any;
        timestamp: Date;
        requestId: string;
    };
}
export declare const ERROR_CODES: {
    readonly AUDIO_PROCESSING_FAILED: "AUDIO_PROCESSING_FAILED";
    readonly INVALID_AUDIO_FORMAT: "INVALID_AUDIO_FORMAT";
    readonly AUDIO_TOO_LARGE: "AUDIO_TOO_LARGE";
    readonly MICROPHONE_PERMISSION_DENIED: "MICROPHONE_PERMISSION_DENIED";
    readonly EXTERNAL_API_ERROR: "EXTERNAL_API_ERROR";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly API_KEY_INVALID: "API_KEY_INVALID";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly CONNECTION_TIMEOUT: "CONNECTION_TIMEOUT";
    readonly WEBSOCKET_CONNECTION_FAILED: "WEBSOCKET_CONNECTION_FAILED";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
    readonly INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly LEGAL_COMPLIANCE_VIOLATION: "LEGAL_COMPLIANCE_VIOLATION";
    readonly INAPPROPRIATE_CONTENT: "INAPPROPRIATE_CONTENT";
};
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
//# sourceMappingURL=errors.d.ts.map