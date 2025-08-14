import { ConversationContext } from '../types';
export interface ProfessionalReferralRequest {
    name: string;
    email: string;
    phone: string;
    preferredContact: 'email' | 'phone';
    urgency: 'low' | 'medium' | 'high';
    description: string;
    sessionId: string;
    referralReason: string;
}
export interface LegalComplianceResult {
    isCompliant: boolean;
    requiresProfessionalReferral: boolean;
    referralReason?: string;
    suggestedResponse?: string;
    complianceIssues: string[];
}
export declare class LegalComplianceService {
    private readonly COMPLEX_LEGAL_INDICATORS;
    private readonly PROHIBITED_ADVICE_PATTERNS;
    private readonly APPROPRIATE_RESPONSES;
    analyzeLegalCompliance(response: string, userInput: string, context: ConversationContext): Promise<LegalComplianceResult>;
    processProfessionalReferral(request: ProfessionalReferralRequest): Promise<boolean>;
    generateLegalDisclaimer(context: ConversationContext): string;
    private analyzeQueryComplexity;
    private analyzeConversationComplexity;
    private isLegalTopic;
    private hasAppropriateDisclaimer;
    private getAppropriateResponse;
    private validateReferralRequest;
    private simulateReferralProcessing;
}
export declare const legalComplianceService: LegalComplianceService;
//# sourceMappingURL=legalComplianceService.d.ts.map