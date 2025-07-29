/**
 * Conversation Logging Service Tests
 * Requirements: 6.4, 5.4, 5.5
 */

import { ConversationLoggingService, PrivacySettings } from '../services/conversationLoggingService';
import { Message, QueryComplexity } from '../types';

describe('ConversationLoggingService', () => {
  let loggingService: ConversationLoggingService;
  let mockPrivacySettings: PrivacySettings;
  let mockMessage: Message;

  beforeEach(() => {
    loggingService = new ConversationLoggingService();
    mockPrivacySettings = {
      enableConversationLogging: true,
      enableAudioRecording: false,
      dataRetentionDays: 30,
      allowAnalytics: false,
      allowQualityImprovement: false
    };
    mockMessage = {
      id: 'msg-123',
      timestamp: new Date(),
      type: 'user',
      content: 'Hello, I have a legal question',
      audioUrl: 'https://example.com/audio/123.mp3',
      metadata: {
        confidence: 0.95,
        processingTime: 1500,
        queryComplexity: QueryComplexity.SIMPLE
      }
    };
  });

  describe('logMessage', () => {
    it('should log message when conversation logging is enabled', async () => {
      const sessionId = 'test-session-123';

      await loggingService.logMessage(sessionId, mockMessage, mockPrivacySettings);

      const conversationLog = await loggingService.getConversationLog(sessionId);
      expect(conversationLog).toBeDefined();
      expect(conversationLog!.messages).toHaveLength(1);
      expect(conversationLog!.messages[0].content).toBe(mockMessage.content);
    });

    it('should not log message when conversation logging is disabled', async () => {
      const sessionId = 'test-session-124';
      const disabledSettings = { ...mockPrivacySettings, enableConversationLogging: false };

      await loggingService.logMessage(sessionId, mockMessage, disabledSettings);

      const conversationLog = await loggingService.getConversationLog(sessionId);
      expect(conversationLog).toBeNull();
    });

    it('should sanitize audio URL when audio recording is disabled', async () => {
      const sessionId = 'test-session-125';
      const noAudioSettings = { ...mockPrivacySettings, enableAudioRecording: false };

      await loggingService.logMessage(sessionId, mockMessage, noAudioSettings);

      const conversationLog = await loggingService.getConversationLog(sessionId);
      expect(conversationLog!.messages[0].audioUrl).toBeUndefined();
    });

    it('should preserve audio URL when audio recording is enabled', async () => {
      const sessionId = 'test-session-126';
      const audioEnabledSettings = { ...mockPrivacySettings, enableAudioRecording: true };

      await loggingService.logMessage(sessionId, mockMessage, audioEnabledSettings);

      const conversationLog = await loggingService.getConversationLog(sessionId);
      expect(conversationLog!.messages[0].audioUrl).toBe(mockMessage.audioUrl);
    });

    it('should set correct scheduled deletion date based on retention period', async () => {
      const sessionId = 'test-session-127';
      const customRetentionSettings = { ...mockPrivacySettings, dataRetentionDays: 7 };

      await loggingService.logMessage(sessionId, mockMessage, customRetentionSettings);

      const conversationLog = await loggingService.getConversationLog(sessionId);
      const expectedDeletionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const actualDeletionDate = conversationLog!.scheduledDeletionAt;
      
      // Allow for small time differences (within 1 minute)
      expect(Math.abs(actualDeletionDate.getTime() - expectedDeletionDate.getTime())).toBeLessThan(60000);
    });
  });

  describe('updatePrivacySettings', () => {
    it('should update privacy settings for existing conversation', async () => {
      const sessionId = 'test-session-128';
      
      // Create initial conversation
      await loggingService.logMessage(sessionId, mockMessage, mockPrivacySettings);

      // Update settings
      const newSettings = { ...mockPrivacySettings, dataRetentionDays: 60, allowAnalytics: true };
      await loggingService.updatePrivacySettings(sessionId, newSettings);

      const conversationLog = await loggingService.getConversationLog(sessionId);
      expect(conversationLog!.privacySettings.dataRetentionDays).toBe(60);
      expect(conversationLog!.privacySettings.allowAnalytics).toBe(true);
    });

    it('should schedule immediate deletion when logging is disabled', async () => {
      const sessionId = 'test-session-129';
      
      // Create initial conversation
      await loggingService.logMessage(sessionId, mockMessage, mockPrivacySettings);

      // Disable logging
      const disabledSettings = { ...mockPrivacySettings, enableConversationLogging: false };
      await loggingService.updatePrivacySettings(sessionId, disabledSettings);

      // Conversation should be scheduled for deletion
      const conversationLog = await loggingService.getConversationLog(sessionId);
      expect(conversationLog).toBeNull();
    });

    it('should remove audio URLs when audio recording is disabled', async () => {
      const sessionId = 'test-session-130';
      const audioEnabledSettings = { ...mockPrivacySettings, enableAudioRecording: true };
      
      // Create conversation with audio
      await loggingService.logMessage(sessionId, mockMessage, audioEnabledSettings);

      // Disable audio recording
      const audioDisabledSettings = { ...mockPrivacySettings, enableAudioRecording: false };
      await loggingService.updatePrivacySettings(sessionId, audioDisabledSettings);

      const conversationLog = await loggingService.getConversationLog(sessionId);
      expect(conversationLog!.messages[0].audioUrl).toBeUndefined();
    });
  });

  describe('scheduleDataDeletion', () => {
    it('should immediately delete conversation data when requested', async () => {
      const sessionId = 'test-session-131';
      
      // Create conversation
      await loggingService.logMessage(sessionId, mockMessage, mockPrivacySettings);

      // Request immediate deletion
      await loggingService.scheduleDataDeletion({
        sessionId,
        requestType: 'immediate',
        reason: 'User requested deletion'
      });

      const conversationLog = await loggingService.getConversationLog(sessionId);
      expect(conversationLog).toBeNull();
    });

    it('should schedule future deletion when requested', async () => {
      const sessionId = 'test-session-132';
      
      // Create conversation
      await loggingService.logMessage(sessionId, mockMessage, mockPrivacySettings);

      // Schedule deletion
      await loggingService.scheduleDataDeletion({
        sessionId,
        requestType: 'scheduled',
        reason: 'Scheduled cleanup'
      });

      // Conversation should still exist
      const conversationLog = await loggingService.getConversationLog(sessionId);
      expect(conversationLog).toBeDefined();
    });
  });

  describe('exportUserData', () => {
    it('should export user data in correct format', async () => {
      const sessionId = 'test-session-133';
      
      // Create conversation with multiple messages
      await loggingService.logMessage(sessionId, mockMessage, mockPrivacySettings);
      
      const secondMessage = {
        ...mockMessage,
        id: 'msg-124',
        type: 'assistant' as const,
        content: 'I can help you with general legal information.'
      };
      await loggingService.logMessage(sessionId, secondMessage, mockPrivacySettings);

      const exportData = await loggingService.exportUserData(sessionId);

      expect(exportData).toBeDefined();
      expect(exportData.sessionId).toBe(sessionId);
      expect(exportData.conversationCount).toBe(2);
      expect(exportData.messages).toHaveLength(2);
      expect(exportData.privacySettings).toEqual(mockPrivacySettings);
    });

    it('should return null for non-existent session', async () => {
      const exportData = await loggingService.exportUserData('non-existent-session');
      expect(exportData).toBeNull();
    });

    it('should exclude audio URLs from export when audio recording is disabled', async () => {
      const sessionId = 'test-session-134';
      const noAudioSettings = { ...mockPrivacySettings, enableAudioRecording: false };
      
      await loggingService.logMessage(sessionId, mockMessage, noAudioSettings);

      const exportData = await loggingService.exportUserData(sessionId);
      expect(exportData.messages[0].audioUrl).toBeUndefined();
    });

    it('should include audio URLs in export when audio recording is enabled', async () => {
      const sessionId = 'test-session-135';
      const audioEnabledSettings = { ...mockPrivacySettings, enableAudioRecording: true };
      
      await loggingService.logMessage(sessionId, mockMessage, audioEnabledSettings);

      const exportData = await loggingService.exportUserData(sessionId);
      expect(exportData.messages[0].audioUrl).toBe(mockMessage.audioUrl);
    });
  });

  describe('getAnalyticsData', () => {
    it('should return analytics data when user has opted in', async () => {
      const sessionId = 'test-session-136';
      const analyticsEnabledSettings = { ...mockPrivacySettings, allowAnalytics: true };
      
      // Create conversation with processing time data
      const messageWithTiming = {
        ...mockMessage,
        metadata: { ...mockMessage.metadata, processingTime: 1200 }
      };
      await loggingService.logMessage(sessionId, messageWithTiming, analyticsEnabledSettings);

      const analyticsData = await loggingService.getAnalyticsData(sessionId);

      expect(analyticsData).toBeDefined();
      expect(analyticsData.messageCount).toBe(1);
      expect(analyticsData.averageResponseTime).toBe(1200);
      expect(analyticsData.conversationDuration).toBeGreaterThan(0);
    });

    it('should return null when user has not opted in to analytics', async () => {
      const sessionId = 'test-session-137';
      const noAnalyticsSettings = { ...mockPrivacySettings, allowAnalytics: false };
      
      await loggingService.logMessage(sessionId, mockMessage, noAnalyticsSettings);

      const analyticsData = await loggingService.getAnalyticsData(sessionId);
      expect(analyticsData).toBeNull();
    });

    it('should return null for non-existent session', async () => {
      const analyticsData = await loggingService.getAnalyticsData('non-existent-session');
      expect(analyticsData).toBeNull();
    });
  });

  describe('Data Retention and Cleanup', () => {
    it('should return null for expired conversation logs', async () => {
      const sessionId = 'test-session-138';
      
      // Create conversation with very short retention period
      const shortRetentionSettings = { ...mockPrivacySettings, dataRetentionDays: 0 };
      await loggingService.logMessage(sessionId, mockMessage, shortRetentionSettings);

      // Wait a small amount of time to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 10));

      const conversationLog = await loggingService.getConversationLog(sessionId);
      expect(conversationLog).toBeNull();
    });
  });

  describe('Privacy Settings Validation', () => {
    it('should handle various privacy setting combinations', async () => {
      const sessionId = 'test-session-139';
      
      const customSettings: PrivacySettings = {
        enableConversationLogging: true,
        enableAudioRecording: true,
        dataRetentionDays: 90,
        allowAnalytics: true,
        allowQualityImprovement: true
      };

      await loggingService.logMessage(sessionId, mockMessage, customSettings);

      const conversationLog = await loggingService.getConversationLog(sessionId);
      expect(conversationLog!.privacySettings).toEqual(customSettings);
      expect(conversationLog!.messages[0].audioUrl).toBe(mockMessage.audioUrl);
    });
  });
});