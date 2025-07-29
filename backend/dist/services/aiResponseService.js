"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIResponseService = void 0;
const openai_1 = __importDefault(require("openai"));
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const types_1 = require("../types");
const errorHandler_1 = require("../utils/errorHandler");
const legalComplianceService_1 = require("./legalComplianceService");
const cacheService_1 = require("./cacheService");
class AIResponseService {
    constructor() {
        this.LEGAL_DISCLAIMER = `
I'm Ellie, an AI assistant for this law firm. I provide general information only and cannot give specific legal advice. 
For legal matters requiring professional judgment, please consult with one of our attorneys directly.
`;
        this.LEGAL_COMPLIANCE_KEYWORDS = [
            'specific legal advice', 'legal representation', 'court case', 'lawsuit', 'legal strategy',
            'attorney-client privilege', 'confidential legal matter', 'legal opinion', 'legal counsel'
        ];
        this.INAPPROPRIATE_CONTENT_KEYWORDS = [
            'illegal activity', 'violence', 'harassment', 'discrimination', 'hate speech'
        ];
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }
        if (!process.env.GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY environment variable is required');
        }
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.groq = new groq_sdk_1.default({
            apiKey: process.env.GROQ_API_KEY,
        });
        this.legalComplianceService = new legalComplianceService_1.LegalComplianceService();
    }
    async generateResponse(userInput, context) {
        const startTime = Date.now();
        if (!userInput || userInput.trim().length === 0) {
            throw (0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.INVALID_INPUT, 'User input is required for AI response generation.', { userInput });
        }
        if (this.containsInappropriateContent(userInput)) {
            throw (0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.INAPPROPRIATE_CONTENT, 'Content not appropriate for this service. Please modify your message.', { userInput: userInput.substring(0, 100) + '...' });
        }
        try {
            const cachedResponse = await cacheService_1.cacheService.getCachedAIResponse(userInput, context);
            if (cachedResponse) {
                console.log('AI response cache hit');
                return cachedResponse;
            }
            const complexity = this.analyzeQueryComplexity(userInput, context);
            const apiToUse = this.routeToOptimalAPI(userInput, complexity);
            let response;
            let metadata = {
                queryComplexity: complexity,
                apiUsed: apiToUse,
                processingTime: 0
            };
            if (apiToUse === 'groq') {
                response = await this.processWithGroq(userInput, context);
            }
            else {
                response = await this.processWithOpenAI(userInput, context);
            }
            const complianceResult = await this.legalComplianceService.analyzeLegalCompliance(response, userInput, context);
            if (!complianceResult.isCompliant) {
                console.warn('Legal compliance issues detected:', complianceResult.complianceIssues);
                response = complianceResult.suggestedResponse || this.handleFallbackResponses(new Error('Legal compliance violation'));
            }
            if (complianceResult.requiresProfessionalReferral) {
                const disclaimer = this.legalComplianceService.generateLegalDisclaimer(context);
                response = `${response}\n\n${disclaimer}\n\nFor this matter, I recommend consulting with one of our qualified attorneys who can provide personalized legal guidance. Would you like me to help you schedule a consultation?`;
                metadata.requiresProfessionalReferral = true;
                metadata.referralReason = complianceResult.referralReason;
            }
            metadata.processingTime = Date.now() - startTime;
            console.log(`AI response generated in ${metadata.processingTime}ms using ${apiToUse}`);
            await cacheService_1.cacheService.cacheAIResponse(userInput, context, response, {
                ttl: complexity === types_1.QueryComplexity.SIMPLE ? 7200 : 3600,
                language: context.userPreferences?.language || 'en'
            });
            return response;
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            console.error('AI response generation failed:', error);
            return this.handleFallbackResponses(error instanceof Error ? error : new Error('Unknown error'));
        }
    }
    routeToOptimalAPI(query, complexity) {
        if (complexity === types_1.QueryComplexity.COMPLEX) {
            return 'openai';
        }
        const legalKeywords = [
            'contract', 'agreement', 'liability', 'damages', 'negligence', 'breach',
            'intellectual property', 'copyright', 'trademark', 'patent', 'employment law',
            'real estate', 'estate planning', 'will', 'trust', 'probate', 'divorce',
            'custody', 'criminal law', 'civil rights', 'constitutional law'
        ];
        const hasLegalKeywords = legalKeywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()));
        if (hasLegalKeywords && query.length > 50) {
            return 'openai';
        }
        return 'groq';
    }
    analyzeQueryComplexity(query, context) {
        const queryLower = query.toLowerCase();
        const simplePatterns = [
            /^(hi|hello|hey|good morning|good afternoon|good evening)/,
            /^(how are you|what's your name|who are you)/,
            /^(thank you|thanks|bye|goodbye)/,
            /^(yes|no|okay|ok)$/,
            /what (do you do|services)/
        ];
        if (simplePatterns.some(pattern => pattern.test(queryLower)) || query.length < 20) {
            return types_1.QueryComplexity.SIMPLE;
        }
        const complexIndicators = [
            'multiple parties', 'litigation', 'court proceedings', 'legal strategy',
            'case analysis', 'precedent', 'jurisdiction', 'statute of limitations',
            'constitutional', 'appellate', 'class action', 'settlement negotiation'
        ];
        const hasComplexIndicators = complexIndicators.some(indicator => queryLower.includes(indicator));
        const hasMultipleQuestions = (query.match(/\?/g) || []).length > 1;
        const isLongQuery = query.length > 200;
        const hasLegalJargon = /\b(whereas|heretofore|pursuant|notwithstanding|aforementioned)\b/i.test(query);
        if (hasComplexIndicators || (hasMultipleQuestions && isLongQuery) || hasLegalJargon) {
            return types_1.QueryComplexity.COMPLEX;
        }
        return types_1.QueryComplexity.MODERATE;
    }
    async processWithGroq(userInput, context) {
        try {
            const systemPrompt = this.buildSystemPrompt(context);
            const conversationHistory = this.buildConversationHistory(context);
            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...conversationHistory,
                    { role: 'user', content: userInput }
                ],
                model: 'llama3-8b-8192',
                temperature: 0.7,
                max_tokens: 500,
                top_p: 0.9,
                stream: false
            });
            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('No response generated from Groq API');
            }
            return response.trim();
        }
        catch (error) {
            console.error('Groq API error:', error);
            throw errorHandler_1.ErrorHandler.handleApiError(error);
        }
    }
    async processWithOpenAI(userInput, context) {
        try {
            const systemPrompt = this.buildSystemPrompt(context);
            const conversationHistory = this.buildConversationHistory(context);
            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...conversationHistory,
                    { role: 'user', content: userInput }
                ],
                model: 'gpt-3.5-turbo',
                temperature: 0.6,
                max_tokens: 600,
                top_p: 0.9,
                frequency_penalty: 0.1,
                presence_penalty: 0.1
            });
            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('No response generated from OpenAI API');
            }
            return response.trim();
        }
        catch (error) {
            console.error('OpenAI API error:', error);
            throw errorHandler_1.ErrorHandler.handleApiError(error);
        }
    }
    async validateLegalCompliance(response) {
        const responseLower = response.toLowerCase();
        const prohibitedPatterns = [
            /you should (sue|file a lawsuit|take legal action)/,
            /i recommend (hiring|firing|terminating)/,
            /this is definitely (legal|illegal|a violation)/,
            /you have a strong case/,
            /you will (win|lose) in court/,
            /the statute of limitations (has|hasn't) expired/,
            /you are (liable|not liable) for/
        ];
        const hasProhibitedContent = prohibitedPatterns.some(pattern => pattern.test(responseLower));
        if (hasProhibitedContent) {
            return false;
        }
        const isLegalTopic = this.LEGAL_COMPLIANCE_KEYWORDS.some(keyword => responseLower.includes(keyword.toLowerCase()));
        if (isLegalTopic && !responseLower.includes('general information')) {
            return false;
        }
        return true;
    }
    handleFallbackResponses(error) {
        return errorHandler_1.ErrorHandler.createFallbackResponse(error);
    }
    buildSystemPrompt(context) {
        return `You are Ellie, a professional AI assistant for a law firm. Your role is to:

1. Provide helpful general information about legal topics
2. Direct visitors to appropriate legal services
3. Answer questions about the law firm's services and expertise
4. Maintain a professional, friendly, and approachable tone

IMPORTANT GUIDELINES:
- Never provide specific legal advice or legal opinions
- Always clarify that you provide general information only
- Encourage users to consult with attorneys for specific legal matters
- Be helpful while staying within appropriate boundaries
- If asked about complex legal matters, recommend speaking with an attorney

${this.LEGAL_DISCLAIMER}

Current conversation context:
- Session ID: ${context.sessionId}
- Legal disclaimer acknowledged: ${context.legalDisclaimer}
- Conversation length: ${context.conversationHistory.length} messages`;
    }
    buildConversationHistory(context) {
        const recentMessages = context.conversationHistory.slice(-5);
        return recentMessages.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));
    }
    containsInappropriateContent(input) {
        const inputLower = input.toLowerCase();
        return this.INAPPROPRIATE_CONTENT_KEYWORDS.some(keyword => inputLower.includes(keyword.toLowerCase()));
    }
}
exports.AIResponseService = AIResponseService;
//# sourceMappingURL=aiResponseService.js.map