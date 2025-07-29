"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationLoggingService = void 0;
const types_1 = require("../types");
const errorHandler_1 = require("../utils/errorHandler");
class ConversationLoggingService {
    constructor() {
        this.conversationLogs = new Map();
        this.deletionQueue = new Map();
        this.DEFAULT_PRIVACY_SETTINGS = {
            enableConversationLogging: true,
            enableAudioRecording: false,
            dataRetentionDays: 30,
            allowAnalytics: false,
            allowQualityImprovement: false
        };
        this.startCleanupScheduler();
    }
    async logMessage(sessionId, message, privacySettings) {
        try {
            if (!privacySettings.enableConversationLogging) {
                return;
            }
            let conversationLog = this.conversationLogs.get(sessionId);
            if (!conversationLog) {
                conversationLog = this.createNewConversationLog(sessionId, privacySettings);
                this.conversationLogs.set(sessionId, conversationLog);
            }
            const sanitizedMessage = this.sanitizeMessage(message, privacySettings);
            conversationLog.messages.push(sanitizedMessage);
            conversationLog.lastUpdatedAt = new Date();
            if (conversationLog.privacySettings.dataRetentionDays !== privacySettings.dataRetentionDays) {
                conversationLog.scheduledDeletionAt = new Date(Date.now() + privacySettings.dataRetentionDays * 24 * 60 * 60 * 1000);
                conversationLog.privacySettings = privacySettings;
            }
            console.log(`Message logged for session ${sessionId} (retention: ${privacySettings.dataRetentionDays} days)`);
        }
        catch (error) {
            console.error('Failed to log conversation message:', error);
            throw (0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.LOGGING_FAILED, 'Failed to log conversation message', { sessionId, messageId: message.id });
        }
    }
    async getConversationLog(sessionId) {
        const log = this.conversationLogs.get(sessionId);
        if (!log || log.isDeleted) {
            return null;
        }
        if (new Date() > log.scheduledDeletionAt) {
            await this.deleteConversationLog(sessionId);
            return null;
        }
        return log;
    }
    async updatePrivacySettings(sessionId, newSettings) {
        try {
            const log = this.conversationLogs.get(sessionId);
            if (!log || log.isDeleted) {
                return;
            }
            const oldSettings = log.privacySettings;
            log.privacySettings = newSettings;
            log.lastUpdatedAt = new Date();
            if (oldSettings.dataRetentionDays !== newSettings.dataRetentionDays) {
                log.scheduledDeletionAt = new Date(Date.now() + newSettings.dataRetentionDays * 24 * 60 * 60 * 1000);
            }
            if (oldSettings.enableConversationLogging && !newSettings.enableConversationLogging) {
                await this.scheduleDataDeletion({
                    sessionId,
                    requestType: 'immediate',
                    reason: 'User disabled conversation logging'
                });
            }
            if (oldSettings.enableAudioRecording && !newSettings.enableAudioRecording) {
                log.messages.forEach(message => {
                    if (message.audioUrl) {
                        delete message.audioUrl;
                    }
                });
            }
            console.log(`Privacy settings updated for session ${sessionId}`);
        }
        catch (error) {
            console.error('Failed to update privacy settings:', error);
            throw (0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.PRIVACY_UPDATE_FAILED, 'Failed to update privacy settings', { sessionId });
        }
    }
    async scheduleDataDeletion(request) {
        try {
            if (request.requestType === 'immediate') {
                if (request.sessionId) {
                    await this.deleteConversationLog(request.sessionId);
                }
                else if (request.userId) {
                    await this.deleteUserData(request.userId);
                }
            }
            else {
                const deletionDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                if (request.sessionId) {
                    this.deletionQueue.set(request.sessionId, deletionDate);
                }
            }
            console.log(`Data deletion ${request.requestType} scheduled:`, request);
        }
        catch (error) {
            console.error('Failed to schedule data deletion:', error);
            throw (0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.DELETION_FAILED, 'Failed to schedule data deletion', request);
        }
    }
    async exportUserData(sessionId) {
        try {
            const log = this.conversationLogs.get(sessionId);
            if (!log || log.isDeleted) {
                return null;
            }
            const exportData = {
                sessionId: log.sessionId,
                userId: log.userId,
                conversationCount: log.messages.length,
                createdAt: log.createdAt,
                lastUpdatedAt: log.lastUpdatedAt,
                privacySettings: log.privacySettings,
                messages: log.messages.map(msg => ({
                    id: msg.id,
                    timestamp: msg.timestamp,
                    type: msg.type,
                    content: msg.content,
                    ...(log.privacySettings.enableAudioRecording && msg.audioUrl && { audioUrl: msg.audioUrl }),
                    metadata: {
                        confidence: msg.metadata.confidence,
                        processingTime: msg.metadata.processingTime
                    }
                }))
            };
            console.log(`Data export generated for session ${sessionId}`);
            return exportData;
        }
        catch (error) {
            console.error('Failed to export user data:', error);
            throw (0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.EXPORT_FAILED, 'Failed to export user data', { sessionId });
        }
    }
    async getAnalyticsData(sessionId) {
        const log = this.conversationLogs.get(sessionId);
        if (!log || log.isDeleted || !log.privacySettings.allowAnalytics) {
            return null;
        }
        return {
            messageCount: log.messages.length,
            averageResponseTime: this.calculateAverageResponseTime(log.messages),
            conversationDuration: log.lastUpdatedAt.getTime() - log.createdAt.getTime(),
            queryComplexityDistribution: this.analyzeQueryComplexity(log.messages),
        };
    }
    createNewConversationLog(sessionId, privacySettings) {
        const now = new Date();
        const scheduledDeletionAt = new Date(now.getTime() + privacySettings.dataRetentionDays * 24 * 60 * 60 * 1000);
        return {
            sessionId,
            messages: [],
            privacySettings,
            createdAt: now,
            lastUpdatedAt: now,
            scheduledDeletionAt,
            isDeleted: false
        };
    }
    sanitizeMessage(message, privacySettings) {
        const sanitized = { ...message };
        if (!privacySettings.enableAudioRecording && sanitized.audioUrl) {
            delete sanitized.audioUrl;
        }
        if (!privacySettings.allowQualityImprovement) {
            sanitized.metadata = {
                confidence: sanitized.metadata.confidence,
                processingTime: sanitized.metadata.processingTime
            };
        }
        return sanitized;
    }
    async deleteConversationLog(sessionId) {
        const log = this.conversationLogs.get(sessionId);
        if (log) {
            log.isDeleted = true;
            log.messages = [];
            console.log(`Conversation log deleted for session ${sessionId}`);
        }
        this.deletionQueue.delete(sessionId);
    }
    async deleteUserData(userId) {
        const sessionsToDelete = [];
        for (const [sessionId, log] of this.conversationLogs.entries()) {
            if (log.userId === userId && !log.isDeleted) {
                sessionsToDelete.push(sessionId);
            }
        }
        for (const sessionId of sessionsToDelete) {
            await this.deleteConversationLog(sessionId);
        }
        console.log(`All data deleted for user ${userId} (${sessionsToDelete.length} sessions)`);
    }
    startCleanupScheduler() {
        setInterval(() => {
            this.performScheduledCleanup();
        }, 60 * 60 * 1000);
        console.log('Conversation logging cleanup scheduler started');
    }
    async performScheduledCleanup() {
        const now = new Date();
        const sessionsToDelete = [];
        for (const [sessionId, log] of this.conversationLogs.entries()) {
            if (!log.isDeleted && now > log.scheduledDeletionAt) {
                sessionsToDelete.push(sessionId);
            }
        }
        for (const [sessionId, deletionDate] of this.deletionQueue.entries()) {
            if (now > deletionDate) {
                sessionsToDelete.push(sessionId);
            }
        }
        for (const sessionId of sessionsToDelete) {
            await this.deleteConversationLog(sessionId);
        }
        if (sessionsToDelete.length > 0) {
            console.log(`Scheduled cleanup completed: ${sessionsToDelete.length} sessions deleted`);
        }
    }
    calculateAverageResponseTime(messages) {
        const responseTimes = messages
            .filter(msg => msg.metadata.processingTime)
            .map(msg => msg.metadata.processingTime);
        if (responseTimes.length === 0)
            return 0;
        return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }
    analyzeQueryComplexity(messages) {
        const distribution = {
            [types_1.QueryComplexity.SIMPLE]: 0,
            [types_1.QueryComplexity.MODERATE]: 0,
            [types_1.QueryComplexity.COMPLEX]: 0
        };
        messages
            .filter(msg => msg.type === 'user')
            .forEach(msg => {
            const complexity = msg.metadata.queryComplexity || types_1.QueryComplexity.SIMPLE;
            if (complexity in distribution) {
                distribution[complexity]++;
            }
        });
        return distribution;
    }
}
exports.ConversationLoggingService = ConversationLoggingService;
//# sourceMappingURL=conversationLoggingService.js.map