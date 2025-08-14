import { ConversationContext, QueryComplexity } from '../types';
export declare class AIResponseService {
    private openai;
    private groq;
    private legalComplianceService;
    private readonly LEGAL_DISCLAIMER;
    private readonly LEGAL_COMPLIANCE_KEYWORDS;
    private readonly INAPPROPRIATE_CONTENT_KEYWORDS;
    constructor();
    generateResponse(userInput: string, context: ConversationContext): Promise<string>;
    routeToOptimalAPI(query: string, complexity: QueryComplexity): 'groq' | 'openai';
    private analyzeQueryComplexity;
    processWithGroq(userInput: string, context: ConversationContext): Promise<string>;
    processWithOpenAI(userInput: string, context: ConversationContext): Promise<string>;
    validateLegalCompliance(response: string): Promise<boolean>;
    handleFallbackResponses(error: Error): string;
    private buildSystemPrompt;
    private buildConversationHistory;
    private containsInappropriateContent;
}
export declare const aiResponseService: AIResponseService;
//# sourceMappingURL=aiResponseService.d.ts.map