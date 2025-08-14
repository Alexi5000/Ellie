"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.legalComplianceService = exports.LegalComplianceService = void 0;
const types_1 = require("../types");
const errorHandler_1 = require("../utils/errorHandler");
class LegalComplianceService {
    constructor() {
        this.COMPLEX_LEGAL_INDICATORS = [
            'lawsuit', 'litigation', 'court case', 'trial', 'hearing', 'deposition',
            'discovery', 'motion', 'appeal', 'judgment', 'verdict', 'settlement negotiation',
            'should i sue', 'can i sue', 'do i have a case', 'what are my chances',
            'legal strategy', 'how to proceed legally', 'next legal steps',
            'criminal charges', 'felony', 'misdemeanor', 'arrest', 'indictment',
            'constitutional law', 'federal law', 'appellate court', 'supreme court',
            'class action', 'securities fraud', 'antitrust', 'intellectual property dispute',
            'malpractice', 'professional negligence', 'breach of fiduciary duty',
            'attorney misconduct', 'legal ethics violation',
            'merger', 'acquisition', 'securities offering', 'ipo', 'venture capital',
            'private equity', 'corporate governance', 'shareholder dispute',
            'restraining order', 'injunction', 'emergency motion', 'temporary restraining order',
            'immediate legal action', 'urgent legal matter', 'time sensitive legal issue'
        ];
        this.PROHIBITED_ADVICE_PATTERNS = [
            /you should (sue|file a lawsuit|take legal action|hire an attorney)/i,
            /i recommend (suing|filing|taking legal action)/i,
            /you have a (strong|weak|good|bad) case/i,
            /you will (win|lose|succeed|fail) in court/i,
            /the statute of limitations (has|hasn't) (expired|run)/i,
            /you are (liable|not liable|responsible|not responsible) for/i,
            /this is (definitely|clearly) (legal|illegal|a violation)/i,
            /you should (plead|confess|admit|deny)/i,
            /you can expect to (win|lose|recover|receive)/i,
            /the court will (rule|decide|find) in your favor/i,
            /you have grounds for/i,
            /this constitutes (fraud|negligence|breach|violation)/i,
            /you should sign/i,
            /don't sign/i,
            /this contract is (valid|invalid|enforceable|unenforceable)/i,
            /you should (accept|reject) this (offer|settlement)/i
        ];
        this.APPROPRIATE_RESPONSES = {
            GENERAL_LEGAL_INFO: "I can provide general information about legal topics, but for specific advice about your situation, I'd recommend consulting with one of our qualified attorneys.",
            COMPLEX_MATTER: "This sounds like a complex legal matter that would benefit from professional legal analysis. Let me connect you with one of our experienced attorneys who can provide personalized guidance.",
            URGENT_MATTER: "This appears to be an urgent legal matter. I strongly recommend speaking with an attorney immediately. Would you like me to arrange an emergency consultation?",
            LITIGATION_MATTER: "Legal proceedings and litigation strategy require professional legal representation. Our attorneys have extensive experience in this area and can provide the specialized guidance you need.",
            CRIMINAL_MATTER: "Criminal law matters require immediate professional legal representation. I can connect you with attorneys who specialize in criminal defense.",
            BUSINESS_LEGAL: "Complex business legal matters require specialized expertise. Our corporate attorneys can provide the professional guidance needed for these sophisticated legal issues."
        };
    }
    async analyzeLegalCompliance(response, userInput, context) {
        const complianceIssues = [];
        let requiresProfessionalReferral = false;
        let referralReason = '';
        let suggestedResponse = '';
        const hasProhibitedAdvice = this.PROHIBITED_ADVICE_PATTERNS.some(pattern => {
            if (pattern.test(response)) {
                complianceIssues.push('Response contains specific legal advice');
                return true;
            }
            return false;
        });
        const complexityAnalysis = this.analyzeQueryComplexity(userInput);
        if (complexityAnalysis.isComplex) {
            requiresProfessionalReferral = true;
            referralReason = complexityAnalysis.reason;
            suggestedResponse = complexityAnalysis.suggestedResponse;
        }
        const isLegalTopic = this.isLegalTopic(userInput);
        if (isLegalTopic && !this.hasAppropriateDisclaimer(response)) {
            complianceIssues.push('Legal response missing appropriate disclaimer');
        }
        const conversationComplexity = this.analyzeConversationComplexity(context);
        if (conversationComplexity.shouldRefer) {
            requiresProfessionalReferral = true;
            referralReason = conversationComplexity.reason;
        }
        const isCompliant = complianceIssues.length === 0 && !hasProhibitedAdvice;
        return {
            isCompliant,
            requiresProfessionalReferral,
            referralReason,
            suggestedResponse,
            complianceIssues
        };
    }
    async processProfessionalReferral(request) {
        try {
            this.validateReferralRequest(request);
            console.log('Professional referral request:', {
                sessionId: request.sessionId,
                urgency: request.urgency,
                preferredContact: request.preferredContact,
                timestamp: new Date().toISOString()
            });
            await this.simulateReferralProcessing(request);
            return true;
        }
        catch (error) {
            console.error('Failed to process professional referral:', error);
            throw (0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.REFERRAL_PROCESSING_FAILED, 'Failed to process professional referral request', { sessionId: request.sessionId });
        }
    }
    generateLegalDisclaimer(context) {
        const baseDisclaimer = "I'm Ellie, an AI assistant that provides general information only. I cannot give specific legal advice, and this conversation does not create an attorney-client relationship.";
        const recentMessages = context.conversationHistory.slice(-3);
        const hasLegalQuestions = recentMessages.some(msg => this.isLegalTopic(msg.content));
        if (hasLegalQuestions) {
            return `${baseDisclaimer} For specific legal advice about your situation, please consult with one of our qualified attorneys.`;
        }
        return baseDisclaimer;
    }
    analyzeQueryComplexity(query) {
        const queryLower = query.toLowerCase();
        for (const indicator of this.COMPLEX_LEGAL_INDICATORS) {
            if (queryLower.includes(indicator.toLowerCase())) {
                return {
                    isComplex: true,
                    reason: `Query involves complex legal matter: ${indicator}`,
                    suggestedResponse: this.getAppropriateResponse(indicator)
                };
            }
        }
        const legalQuestionCount = (query.match(/\b(can i|should i|what if|how do i|is it legal|is it illegal)\b/gi) || []).length;
        if (legalQuestionCount > 2) {
            return {
                isComplex: true,
                reason: 'Multiple complex legal questions require professional analysis',
                suggestedResponse: this.APPROPRIATE_RESPONSES.COMPLEX_MATTER
            };
        }
        const urgentPatterns = [
            /urgent/i, /emergency/i, /immediate/i, /asap/i, /right away/i,
            /time sensitive/i, /deadline/i, /statute of limitations/i
        ];
        if (urgentPatterns.some(pattern => pattern.test(query))) {
            return {
                isComplex: true,
                reason: 'Urgent legal matter requires immediate professional attention',
                suggestedResponse: this.APPROPRIATE_RESPONSES.URGENT_MATTER
            };
        }
        return {
            isComplex: false,
            reason: '',
            suggestedResponse: ''
        };
    }
    analyzeConversationComplexity(context) {
        const messages = context.conversationHistory;
        if (messages.length > 10) {
            const legalMessageCount = messages.filter(msg => this.isLegalTopic(msg.content)).length;
            if (legalMessageCount > 5) {
                return {
                    shouldRefer: true,
                    reason: 'Extended legal discussion would benefit from professional consultation'
                };
            }
        }
        const recentUserMessages = messages
            .filter(msg => msg.type === 'user')
            .slice(-5)
            .map(msg => msg.content.toLowerCase());
        const topicCounts = new Map();
        for (const indicator of this.COMPLEX_LEGAL_INDICATORS) {
            const count = recentUserMessages.filter(msg => msg.includes(indicator.toLowerCase())).length;
            if (count > 1) {
                topicCounts.set(indicator, count);
            }
        }
        if (topicCounts.size > 0) {
            return {
                shouldRefer: true,
                reason: 'Repeated questions about complex legal topics indicate need for professional guidance'
            };
        }
        return {
            shouldRefer: false,
            reason: ''
        };
    }
    isLegalTopic(query) {
        const legalKeywords = [
            'law', 'legal', 'attorney', 'lawyer', 'court', 'judge', 'contract',
            'agreement', 'liability', 'damages', 'sue', 'lawsuit', 'rights',
            'violation', 'breach', 'negligence', 'fraud', 'criminal', 'civil'
        ];
        const queryLower = query.toLowerCase();
        return legalKeywords.some(keyword => queryLower.includes(keyword));
    }
    hasAppropriateDisclaimer(response) {
        const disclaimerIndicators = [
            'general information', 'not legal advice', 'consult with an attorney', 'consulting with an attorney',
            'professional legal advice', 'qualified attorney', 'legal professional'
        ];
        const responseLower = response.toLowerCase();
        return disclaimerIndicators.some(indicator => responseLower.includes(indicator));
    }
    getAppropriateResponse(indicator) {
        const indicatorLower = indicator.toLowerCase();
        if (indicatorLower.includes('criminal') || indicatorLower.includes('arrest')) {
            return this.APPROPRIATE_RESPONSES.CRIMINAL_MATTER;
        }
        if (indicatorLower.includes('lawsuit') || indicatorLower.includes('litigation')) {
            return this.APPROPRIATE_RESPONSES.LITIGATION_MATTER;
        }
        if (indicatorLower.includes('urgent') || indicatorLower.includes('emergency')) {
            return this.APPROPRIATE_RESPONSES.URGENT_MATTER;
        }
        if (indicatorLower.includes('business') || indicatorLower.includes('corporate')) {
            return this.APPROPRIATE_RESPONSES.BUSINESS_LEGAL;
        }
        return this.APPROPRIATE_RESPONSES.COMPLEX_MATTER;
    }
    validateReferralRequest(request) {
        const errors = [];
        if (!request.name?.trim()) {
            errors.push('Name is required');
        }
        if (!request.email?.trim()) {
            errors.push('Email is required');
        }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) {
            errors.push('Valid email address is required');
        }
        if (!request.phone?.trim()) {
            errors.push('Phone number is required');
        }
        if (!request.description?.trim()) {
            errors.push('Description of legal matter is required');
        }
        if (!request.sessionId?.trim()) {
            errors.push('Session ID is required');
        }
        if (errors.length > 0) {
            const error = new Error('Invalid referral request');
            error.code = types_1.ERROR_CODES.INVALID_INPUT;
            error.details = { errors };
            throw error;
        }
    }
    async simulateReferralProcessing(request) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`Professional referral processed for ${request.name} (${request.urgency} priority)`);
    }
}
exports.LegalComplianceService = LegalComplianceService;
exports.legalComplianceService = new LegalComplianceService();
//# sourceMappingURL=legalComplianceService.js.map