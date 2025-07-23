/**
 * Conversation-related TypeScript interfaces and types
 * Requirements: 5.4, 6.4
 */

export enum QueryComplexity {
  SIMPLE = "simple",     // Basic greetings, simple questions - use Groq for speed
  MODERATE = "moderate", // General legal information - use Groq
  COMPLEX = "complex",   // Complex legal scenarios - use OpenAI for accuracy
}

export interface UserPreferences {
  voiceSpeed: number;
  language: string;
  accessibilityMode: boolean;
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