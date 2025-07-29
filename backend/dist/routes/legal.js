"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const legalComplianceService_1 = require("../services/legalComplianceService");
const conversationLoggingService_1 = require("../services/conversationLoggingService");
const errorHandler_1 = require("../utils/errorHandler");
const types_1 = require("../types");
const router = express_1.default.Router();
const legalComplianceService = new legalComplianceService_1.LegalComplianceService();
const conversationLoggingService = new conversationLoggingService_1.ConversationLoggingService();
router.post('/referral', async (req, res) => {
    try {
        const referralRequest = req.body;
        if (!referralRequest.name || !referralRequest.email || !referralRequest.phone || !referralRequest.description) {
            return res.status(400).json((0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.INVALID_INPUT, 'Missing required fields for professional referral', { requiredFields: ['name', 'email', 'phone', 'description'] }));
        }
        const success = await legalComplianceService.processProfessionalReferral(referralRequest);
        if (success) {
            res.json({
                success: true,
                message: 'Professional referral request processed successfully',
                referralId: `REF-${Date.now()}`,
                estimatedContactTime: getReferralContactTime(referralRequest.urgency)
            });
        }
        else {
            res.status(500).json((0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.REFERRAL_PROCESSING_FAILED, 'Failed to process professional referral request'));
        }
    }
    catch (error) {
        console.error('Professional referral error:', error);
        res.status(500).json((0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.REFERRAL_PROCESSING_FAILED, 'Failed to process professional referral request', { error: error instanceof Error ? error.message : 'Unknown error' }));
    }
});
router.put('/privacy-settings/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const privacySettings = req.body;
        if (!isValidPrivacySettings(privacySettings)) {
            return res.status(400).json((0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.INVALID_INPUT, 'Invalid privacy settings', { providedSettings: privacySettings }));
        }
        await conversationLoggingService.updatePrivacySettings(sessionId, privacySettings);
        res.json({
            success: true,
            message: 'Privacy settings updated successfully',
            settings: privacySettings
        });
    }
    catch (error) {
        console.error('Privacy settings update error:', error);
        res.status(500).json((0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.PRIVACY_UPDATE_FAILED, 'Failed to update privacy settings', { sessionId: req.params.sessionId }));
    }
});
router.get('/privacy-settings/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const conversationLog = await conversationLoggingService.getConversationLog(sessionId);
        if (!conversationLog) {
            return res.status(404).json((0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.NOT_FOUND, 'Conversation log not found or has been deleted', { sessionId }));
        }
        res.json({
            success: true,
            settings: conversationLog.privacySettings
        });
    }
    catch (error) {
        console.error('Privacy settings retrieval error:', error);
        res.status(500).json((0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.PRIVACY_RETRIEVAL_FAILED, 'Failed to retrieve privacy settings', { sessionId: req.params.sessionId }));
    }
});
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
    }
    catch (error) {
        console.error('Data deletion error:', error);
        res.status(500).json((0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.DELETION_FAILED, 'Failed to process data deletion request', { sessionId: req.params.sessionId }));
    }
});
router.get('/data-export/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const exportData = await conversationLoggingService.exportUserData(sessionId);
        if (!exportData) {
            return res.status(404).json((0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.NOT_FOUND, 'No data found for export or data has been deleted', { sessionId }));
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="ellie-data-export-${sessionId}.json"`);
        res.json({
            exportedAt: new Date().toISOString(),
            dataSubject: sessionId,
            ...exportData
        });
    }
    catch (error) {
        console.error('Data export error:', error);
        res.status(500).json((0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.EXPORT_FAILED, 'Failed to export user data', { sessionId: req.params.sessionId }));
    }
});
router.get('/disclaimer/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const conversationLog = await conversationLoggingService.getConversationLog(sessionId);
        if (!conversationLog) {
            return res.json({
                success: true,
                disclaimer: "I'm Ellie, an AI assistant that provides general information only. I cannot give specific legal advice, and this conversation does not create an attorney-client relationship. For specific legal advice about your situation, please consult with a qualified attorney."
            });
        }
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
    }
    catch (error) {
        console.error('Disclaimer generation error:', error);
        res.status(500).json((0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.DISCLAIMER_GENERATION_FAILED, 'Failed to generate legal disclaimer', { sessionId: req.params.sessionId }));
    }
});
function getReferralContactTime(urgency) {
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
function isValidPrivacySettings(settings) {
    return (typeof settings === 'object' &&
        typeof settings.enableConversationLogging === 'boolean' &&
        typeof settings.enableAudioRecording === 'boolean' &&
        typeof settings.dataRetentionDays === 'number' &&
        settings.dataRetentionDays >= 1 &&
        settings.dataRetentionDays <= 365 &&
        typeof settings.allowAnalytics === 'boolean' &&
        typeof settings.allowQualityImprovement === 'boolean');
}
exports.default = router;
//# sourceMappingURL=legal.js.map