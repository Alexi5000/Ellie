/**
 * Conversation Logging Service - Privacy-compliant conversation data management
 * Requirements: 6.4, 5.4, 5.5
 */

import { ConversationContext, Message, QueryComplexity, ERROR_CODES } from '../types';
import { createErrorResponse } from '../utils/errorHandler';

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

export class ConversationLoggingService {
  private conversationLogs: Map<string, ConversationLog> = new Map();
  private deletionQueue: Map<string, Date> = new Map();

  private readonly DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
    enableConversationLogging: true,
    enableAudioRecording: false,
    dataRetentionDays: 30,
    allowAnalytics: false,
    allowQualityImprovement: false
  };

  constructor() {
    // Start cleanup scheduler
    this.startCleanupScheduler();
  }

  /**
   * Logs conversation message with privacy compliance
   * @param sessionId - Session identifier
   * @param message - Message to log
   * @param privacySettings - User's privacy settings
   */
  public async logMessage(
    sessionId: string,
    message: Message,
    privacySettings: PrivacySettings
  ): Promise<void> {
    try {
      // Check if logging is enabled
      if (!privacySettings.enableConversationLogging) {
        return;
      }

      // Get or create conversation log
      let conversationLog = this.conversationLogs.get(sessionId);
      
      if (!conversationLog) {
        conversationLog = this.createNewConversationLog(sessionId, privacySettings);
        this.conversationLogs.set(sessionId, conversationLog);
      }

      // Sanitize message based on privacy settings
      const sanitizedMessage = this.sanitizeMessage(message, privacySettings);

      // Add message to log
      conversationLog.messages.push(sanitizedMessage);
      conversationLog.lastUpdatedAt = new Date();

      // Update scheduled deletion date if retention period changed
      if (conversationLog.privacySettings.dataRetentionDays !== privacySettings.dataRetentionDays) {
        conversationLog.scheduledDeletionAt = new Date(
          Date.now() + privacySettings.dataRetentionDays * 24 * 60 * 60 * 1000
        );
        conversationLog.privacySettings = privacySettings;
      }

      console.log(`Message logged for session ${sessionId} (retention: ${privacySettings.dataRetentionDays} days)`);

    } catch (error) {
      console.error('Failed to log conversation message:', error);
      throw createErrorResponse(
        ERROR_CODES.LOGGING_FAILED,
        'Failed to log conversation message',
        { sessionId, messageId: message.id }
      );
    }
  }

  /**
   * Retrieves conversation log for a session
   * @param sessionId - Session identifier
   * @returns Conversation log or null if not found/deleted
   */
  public async getConversationLog(sessionId: string): Promise<ConversationLog | null> {
    const log = this.conversationLogs.get(sessionId);
    
    if (!log || log.isDeleted) {
      return null;
    }

    // Check if log has expired
    if (new Date() > log.scheduledDeletionAt) {
      await this.deleteConversationLog(sessionId);
      return null;
    }

    return log;
  }

  /**
   * Updates privacy settings for a session
   * @param sessionId - Session identifier
   * @param newSettings - New privacy settings
   */
  public async updatePrivacySettings(
    sessionId: string,
    newSettings: PrivacySettings
  ): Promise<void> {
    try {
      const log = this.conversationLogs.get(sessionId);
      
      if (!log || log.isDeleted) {
        return;
      }

      const oldSettings = log.privacySettings;
      log.privacySettings = newSettings;
      log.lastUpdatedAt = new Date();

      // Update scheduled deletion if retention period changed
      if (oldSettings.dataRetentionDays !== newSettings.dataRetentionDays) {
        log.scheduledDeletionAt = new Date(
          Date.now() + newSettings.dataRetentionDays * 24 * 60 * 60 * 1000
        );
      }

      // If logging was disabled, schedule immediate deletion
      if (oldSettings.enableConversationLogging && !newSettings.enableConversationLogging) {
        await this.scheduleDataDeletion({
          sessionId,
          requestType: 'immediate',
          reason: 'User disabled conversation logging'
        });
      }

      // If audio recording was disabled, remove audio URLs from existing messages
      if (oldSettings.enableAudioRecording && !newSettings.enableAudioRecording) {
        log.messages.forEach(message => {
          if (message.audioUrl) {
            delete message.audioUrl;
          }
        });
      }

      console.log(`Privacy settings updated for session ${sessionId}`);

    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      throw createErrorResponse(
        ERROR_CODES.PRIVACY_UPDATE_FAILED,
        'Failed to update privacy settings',
        { sessionId }
      );
    }
  }

  /**
   * Schedules or executes data deletion
   * @param request - Data deletion request
   */
  public async scheduleDataDeletion(request: DataDeletionRequest): Promise<void> {
    try {
      if (request.requestType === 'immediate') {
        if (request.sessionId) {
          await this.deleteConversationLog(request.sessionId);
        } else if (request.userId) {
          await this.deleteUserData(request.userId);
        }
      } else {
        // Schedule for later deletion
        const deletionDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        if (request.sessionId) {
          this.deletionQueue.set(request.sessionId, deletionDate);
        }
      }

      console.log(`Data deletion ${request.requestType} scheduled:`, request);

    } catch (error) {
      console.error('Failed to schedule data deletion:', error);
      throw createErrorResponse(
        ERROR_CODES.DELETION_FAILED,
        'Failed to schedule data deletion',
        request
      );
    }
  }

  /**
   * Exports user data for GDPR compliance
   * @param sessionId - Session identifier
   * @returns Exported data
   */
  public async exportUserData(sessionId: string): Promise<any> {
    try {
      const log = this.conversationLogs.get(sessionId);
      
      if (!log || log.isDeleted) {
        return null;
      }

      // Create sanitized export
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
          // Only include audio URL if user has enabled audio recording
          ...(log.privacySettings.enableAudioRecording && msg.audioUrl && { audioUrl: msg.audioUrl }),
          metadata: {
            confidence: msg.metadata.confidence,
            processingTime: msg.metadata.processingTime
          }
        }))
      };

      console.log(`Data export generated for session ${sessionId}`);
      return exportData;

    } catch (error) {
      console.error('Failed to export user data:', error);
      throw createErrorResponse(
        ERROR_CODES.EXPORT_FAILED,
        'Failed to export user data',
        { sessionId }
      );
    }
  }

  /**
   * Gets analytics data (anonymized) if user has opted in
   * @param sessionId - Session identifier
   * @returns Analytics data or null
   */
  public async getAnalyticsData(sessionId: string): Promise<any> {
    const log = this.conversationLogs.get(sessionId);
    
    if (!log || log.isDeleted || !log.privacySettings.allowAnalytics) {
      return null;
    }

    // Return anonymized analytics data
    return {
      messageCount: log.messages.length,
      averageResponseTime: this.calculateAverageResponseTime(log.messages),
      conversationDuration: log.lastUpdatedAt.getTime() - log.createdAt.getTime(),
      queryComplexityDistribution: this.analyzeQueryComplexity(log.messages),
      // No personal information included
    };
  }

  /**
   * Creates new conversation log
   * @param sessionId - Session identifier
   * @param privacySettings - Privacy settings
   * @returns New conversation log
   */
  private createNewConversationLog(
    sessionId: string,
    privacySettings: PrivacySettings
  ): ConversationLog {
    const now = new Date();
    const scheduledDeletionAt = new Date(
      now.getTime() + privacySettings.dataRetentionDays * 24 * 60 * 60 * 1000
    );

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

  /**
   * Sanitizes message based on privacy settings
   * @param message - Original message
   * @param privacySettings - Privacy settings
   * @returns Sanitized message
   */
  private sanitizeMessage(message: Message, privacySettings: PrivacySettings): Message {
    const sanitized = { ...message };

    // Remove audio URL if audio recording is disabled
    if (!privacySettings.enableAudioRecording && sanitized.audioUrl) {
      delete sanitized.audioUrl;
    }

    // Remove detailed metadata if quality improvement is disabled
    if (!privacySettings.allowQualityImprovement) {
      sanitized.metadata = {
        confidence: sanitized.metadata.confidence,
        processingTime: sanitized.metadata.processingTime
      };
    }

    return sanitized;
  }

  /**
   * Deletes conversation log
   * @param sessionId - Session identifier
   */
  private async deleteConversationLog(sessionId: string): Promise<void> {
    const log = this.conversationLogs.get(sessionId);
    
    if (log) {
      log.isDeleted = true;
      log.messages = []; // Clear messages
      
      // In production, this would also:
      // 1. Delete associated audio files
      // 2. Remove from database
      // 3. Clear from any caches
      
      console.log(`Conversation log deleted for session ${sessionId}`);
    }

    // Remove from deletion queue if present
    this.deletionQueue.delete(sessionId);
  }

  /**
   * Deletes all data for a user
   * @param userId - User identifier
   */
  private async deleteUserData(userId: string): Promise<void> {
    const sessionsToDelete: string[] = [];

    // Find all sessions for this user
    for (const [sessionId, log] of this.conversationLogs.entries()) {
      if (log.userId === userId && !log.isDeleted) {
        sessionsToDelete.push(sessionId);
      }
    }

    // Delete all user sessions
    for (const sessionId of sessionsToDelete) {
      await this.deleteConversationLog(sessionId);
    }

    console.log(`All data deleted for user ${userId} (${sessionsToDelete.length} sessions)`);
  }

  /**
   * Starts cleanup scheduler for expired data
   */
  private startCleanupScheduler(): void {
    // Run cleanup every hour
    setInterval(() => {
      this.performScheduledCleanup();
    }, 60 * 60 * 1000);

    console.log('Conversation logging cleanup scheduler started');
  }

  /**
   * Performs scheduled cleanup of expired data
   */
  private async performScheduledCleanup(): Promise<void> {
    const now = new Date();
    const sessionsToDelete: string[] = [];

    // Check for expired conversation logs
    for (const [sessionId, log] of this.conversationLogs.entries()) {
      if (!log.isDeleted && now > log.scheduledDeletionAt) {
        sessionsToDelete.push(sessionId);
      }
    }

    // Check deletion queue
    for (const [sessionId, deletionDate] of this.deletionQueue.entries()) {
      if (now > deletionDate) {
        sessionsToDelete.push(sessionId);
      }
    }

    // Delete expired sessions
    for (const sessionId of sessionsToDelete) {
      await this.deleteConversationLog(sessionId);
    }

    if (sessionsToDelete.length > 0) {
      console.log(`Scheduled cleanup completed: ${sessionsToDelete.length} sessions deleted`);
    }
  }

  /**
   * Calculates average response time from messages
   * @param messages - Array of messages
   * @returns Average response time in milliseconds
   */
  private calculateAverageResponseTime(messages: Message[]): number {
    const responseTimes = messages
      .filter(msg => msg.metadata.processingTime)
      .map(msg => msg.metadata.processingTime!);

    if (responseTimes.length === 0) return 0;

    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  /**
   * Analyzes query complexity distribution
   * @param messages - Array of messages
   * @returns Complexity distribution
   */
  private analyzeQueryComplexity(messages: Message[]): any {
    const distribution = { 
      [QueryComplexity.SIMPLE]: 0, 
      [QueryComplexity.MODERATE]: 0, 
      [QueryComplexity.COMPLEX]: 0 
    };

    messages
      .filter(msg => msg.type === 'user')
      .forEach(msg => {
        const complexity = msg.metadata.queryComplexity || QueryComplexity.SIMPLE;
        if (complexity in distribution) {
          distribution[complexity]++;
        }
      });

    return distribution;
  }
}