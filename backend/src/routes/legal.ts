/**
 * Legal compliance and professional referral API routes
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import express from 'express';
import { LegalComplianceService, ProfessionalReferralRequest } from '../services/legalComplianceService';
import { ConversationLoggingService, PrivacySettings } from '../services/conversationLoggingService';
import { createErrorResponse } from '../utils/errorHandler';
import { ERROR_CODES } from '../types';

const router = express.Router();
const legalComplianceService = new LegalComplianceService();
const conversationLoggingService = new ConversationLoggingService();

/**
 * POST /api/legal/referral
 * Process professional referral request
 */
router.post('/referral', async (req, res) => {
  try {
    const referralRequest: ProfessionalReferralRequest = req.body;

    // Validate required fields
    if (!referralRequest.name || !referralRequest.email || !referralRequest.phone || !referralRequest.description) {
      return res.status(400).json(
        createErrorResponse(
          ERROR_CODES.INVALID_INPUT,
          'Missing required fields for professional referral',
          { requiredFields: ['name', 'email', 'phone', 'description'] }
        )
      );
    }

    // Process referral request
    const success = await legalComplianceService.processProfessionalReferral(referralRequest);

    if (success) {
      res.json({
        success: true,
        message: 'Professional referral request processed successfully',
        referralId: `REF-${Date.now()}`, // In production, this would be a proper ID
        estimatedContactTime: getReferralContactTime(referralRequest.urgency)
      });
    } else {
      res.status(500).json(
        createErrorResponse(
          ERROR_CODES.REFERRAL_PROCESSING_FAILED,
          'Failed to process professional referral request'
        )
      );
    }

  } catch (error) {
    console.error('Professional referral error:', error);
    res.status(500).json(
      createErrorResponse(
        ERROR_CODES.REFERRAL_PROCESSING_FAILED,
        'Failed to process professional referral request',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      )
    );
  }
});

/**
 * PUT /api/legal/privacy-settings/:sessionId
 * Update privacy settings for a session
 */
router.put('/privacy-settings/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const privacySettings: PrivacySettings = req.body;

    // Validate privacy settings
    if (!isValidPrivacySettings(privacySettings)) {
      return res.status(400).json(
        createErrorResponse(
          ERROR_CODES.INVALID_INPUT,
          'Invalid privacy settings',
          { providedSettings: privacySettings }
        )
      );
    }

    // Update privacy settings
    await conversationLoggingService.updatePrivacySettings(sessionId, privacySettings);

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      settings: privacySettings
    });

  } catch (error) {
    console.error('Privacy settings update error:', error);
    res.status(500).json(
      createErrorResponse(
        ERROR_CODES.PRIVACY_UPDATE_FAILED,
        'Failed to update privacy settings',
        { sessionId: req.params.sessionId }
      )
    );
  }
});

/**
 * GET /api/legal/privacy-settings/:sessionId
 * Get current privacy settings for a session
 */
router.get('/privacy-settings/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const conversationLog = await conversationLoggingService.getConversationLog(sessionId);
    
    if (!conversationLog) {
      return res.status(404).json(
        createErrorResponse(
          ERROR_CODES.NOT_FOUND,
          'Conversation log not found or has been deleted',
          { sessionId }
        )
      );
    }

    res.json({
      success: true,
      settings: conversationLog.privacySettings
    });

  } catch (error) {
    console.error('Privacy settings retrieval error:', error);
    res.status(500).json(
      createErrorResponse(
        ERROR_CODES.PRIVACY_RETRIEVAL_FAILED,
        'Failed to retrieve privacy settings',
        { sessionId: req.params.sessionId }
      )
    );
  }
});

/**
 * DELETE /api/legal/data/:sessionId
 * Request data deletion for a session
 */
router.delete('/data/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { immediate = true, reason } = req.body;

    await conversationLoggingService.scheduleDataDeletion({
      sessionId,
      requestType: immediate ? 'immediate' : 'scheduled',
      reason
    });

    res.json({
      success: true,
      message: immediate ? 'Data deleted immediately' : 'Data deletion scheduled',
      deletionType: immediate ? 'immediate' : 'scheduled'
    });

  } catch (error) {
    console.error('Data deletion error:', error);
    res.status(500).json(
      createErrorResponse(
        ERROR_CODES.DELETION_FAILED,
        'Failed to process data deletion request',
        { sessionId: req.params.sessionId }
      )
    );
  }
});

/**
 * GET /api/legal/data-export/:sessionId
 * Export user data for GDPR compliance
 */
router.get('/data-export/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const exportData = await conversationLoggingService.exportUserData(sessionId);

    if (!exportData) {
      return res.status(404).json(
        createErrorResponse(
          ERROR_CODES.NOT_FOUND,
          'No data found for export or data has been deleted',
          { sessionId }
        )
      );
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="ellie-data-export-${sessionId}.json"`);
    
    res.json({
      exportedAt: new Date().toISOString(),
      dataSubject: sessionId,
      ...exportData
    });

  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json(
      createErrorResponse(
        ERROR_CODES.EXPORT_FAILED,
        'Failed to export user data',
        { sessionId: req.params.sessionId }
      )
    );
  }
});

/**
 * GET /api/legal/disclaimer/:sessionId
 * Get legal disclaimer for current conversation context
 */
router.get('/disclaimer/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const conversationLog = await conversationLoggingService.getConversationLog(sessionId);
    
    if (!conversationLog) {
      // Return generic disclaimer if no conversation log exists
      return res.json({
        success: true,
        disclaimer: "I'm Ellie, an AI assistant that provides general information only. I cannot give specific legal advice, and this conversation does not create an attorney-client relationship. For specific legal advice about your situation, please consult with a qualified attorney."
      });
    }

    // Create context from conversation log
    const context = {
      sessionId: conversationLog.sessionId,
      userId: conversationLog.userId,
      conversationHistory: conversationLog.messages,
      userPreferences: {
        voiceSpeed: 1.0,
        language: 'en',
        accessibilityMode: false
      },
      legalDisclaimer: true
    };

    const disclaimer = legalComplianceService.generateLegalDisclaimer(context);

    res.json({
      success: true,
      disclaimer,
      contextual: true
    });

  } catch (error) {
    console.error('Disclaimer generation error:', error);
    res.status(500).json(
      createErrorResponse(
        ERROR_CODES.DISCLAIMER_GENERATION_FAILED,
        'Failed to generate legal disclaimer',
        { sessionId: req.params.sessionId }
      )
    );
  }
});

/**
 * Helper function to get estimated contact time based on urgency
 */
function getReferralContactTime(urgency: 'low' | 'medium' | 'high'): string {
  switch (urgency) {
    case 'high':
      return 'within 24 hours';
    case 'medium':
      return '2-3 business days';
    case 'low':
    default:
      return '1-2 weeks';
  }
}

/**
 * Helper function to validate privacy settings
 */
function isValidPrivacySettings(settings: any): settings is PrivacySettings {
  return (
    typeof settings === 'object' &&
    typeof settings.enableConversationLogging === 'boolean' &&
    typeof settings.enableAudioRecording === 'boolean' &&
    typeof settings.dataRetentionDays === 'number' &&
    settings.dataRetentionDays >= 1 &&
    settings.dataRetentionDays <= 365 &&
    typeof settings.allowAnalytics === 'boolean' &&
    typeof settings.allowQualityImprovement === 'boolean'
  );
}

export default router;