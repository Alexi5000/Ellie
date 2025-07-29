export declare enum QueryComplexity {
    SIMPLE = "simple",
    MODERATE = "moderate",
    COMPLEX = "complex"
}
export interface UserPreferences {
    voiceSpeed: number;
    language: string;
    accessibilityMode: boolean;
}
export interface PartialUserPreferences {
    voiceSpeed?: number;
    language?: string;
    accessibilityMode?: boolean;
}
export interface MessageMetadata {
    confidence?: number;
    processingTime?: number;
    apiUsed?: "groq" | "openai";
    queryComplexity?: QueryComplexity;
    requiresProfessionalReferral?: boolean;
    referralReason?: string;
}
export interface Message {
    id: string;
    timestamp: Date;
    type: "user" | "assistant";
    content: string;
    audioUrl?: string;
    metadata: MessageMetadata;
}
export interface ConversationContext {
    sessionId: string;
    userId?: string;
    conversationHistory: Message[];
    userPreferences: UserPreferences;
    legalDisclaimer: boolean;
}
//# sourceMappingURL=conversation.d.ts.map