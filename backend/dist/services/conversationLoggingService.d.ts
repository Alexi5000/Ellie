import { Message } from '../types';
export interface PrivacySettings {
    enableConversationLogging: boolean;
    enableAudioRecording: boolean;
    dataRetentionDays: number;
    allowAnalytics: boolean;
    allowQualityImprovement: boolean;
}
export interface ConversationLog {
    sessionId: string;
    userId?: string;
    messages: Message[];
    privacySettings: PrivacySettings;
    createdAt: Date;
    lastUpdatedAt: Date;
    scheduledDeletionAt: Date;
    isDeleted: boolean;
}
export interface DataDeletionRequest {
    sessionId?: string;
    userId?: string;
    requestType: 'immediate' | 'scheduled';
    reason?: string;
}
export declare class ConversationLoggingService {
    private conversationLogs;
    private deletionQueue;
    private readonly DEFAULT_PRIVACY_SETTINGS;
    constructor();
    logMessage(sessionId: string, message: Message, privacySettings: PrivacySettings): Promise<void>;
    getConversationLog(sessionId: string): Promise<ConversationLog | null>;
    updatePrivacySettings(sessionId: string, newSettings: PrivacySettings): Promise<void>;
    scheduleDataDeletion(request: DataDeletionRequest): Promise<void>;
    exportUserData(sessionId: string): Promise<any>;
    getAnalyticsData(sessionId: string): Promise<any>;
    private createNewConversationLog;
    private sanitizeMessage;
    private deleteConversationLog;
    private deleteUserData;
    private startCleanupScheduler;
    private performScheduledCleanup;
    private calculateAverageResponseTime;
    private analyzeQueryComplexity;
}
//# sourceMappingURL=conversationLoggingService.d.ts.map