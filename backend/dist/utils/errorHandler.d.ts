import { ErrorResponse, ErrorCode } from '../types/errors';
export declare class ErrorHandler {
    static createErrorResponse(code: ErrorCode, message: string, details?: any, requestId?: string): ErrorResponse;
    static formatUserMessage(code: ErrorCode): string;
    static isValidErrorCode(code: string): code is ErrorCode;
    static handleApiError(error: any, requestId?: string): ErrorResponse;
    static createFallbackResponse(error: Error): string;
}
export declare function createErrorResponse(code: ErrorCode, message: string, details?: any, requestId?: string): ErrorResponse;
//# sourceMappingURL=errorHandler.d.ts.map