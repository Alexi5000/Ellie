// Core types for the Ellie Voice Receptionist application

export interface ConversationContext {
  sessionId: string;
  userId?: string;
  conversationHistory: Message[];
  userPreferences: UserPreferences;
  legalDisclaimer: boolean;
}

export interface Message {
  id: string;
  timestamp: Date;
  type: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  metadata: MessageMetadata;
}

export interface MessageMetadata {
  confidence?: number;
  processingTime?: number;
  audioFormat?: string;
  transcriptionSource?: 'whisper' | 'browser';
  queryComplexity?: QueryComplexity;
  requiresProfessionalReferral?: boolean;
  referralReason?: string;
}

export interface UserPreferences {
  voiceSpeed: number;
  language: string;
  accessibilityMode: boolean;
}

export interface AudioInput {
  buffer: ArrayBuffer;
  format: string;
  duration: number;
  sampleRate: number;
}

export interface AudioResponse {
  text: string;
  audioBuffer: ArrayBuffer;
  confidence: number;
  processingTime: number;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
    requestId: string;
  };
}

export enum VoiceState {
  IDLE = 'idle',
  LISTENING = 'listening',
  PROCESSING = 'processing',
  SPEAKING = 'speaking',
  ERROR = 'error'
}

export enum QueryComplexity {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex'
}