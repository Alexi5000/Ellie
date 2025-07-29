/**
 * WebSocket communication types and interfaces
 * Requirements: 5.5, 7.1, 7.2
 */

export interface WebSocketEvents {
  // Client to server events
  'voice-input': (data: VoiceInputData) => void;
  'join-session': (data: JoinSessionData) => void;
  'leave-session': () => void;
  'ping': () => void;
  'change-language': (data: LanguageChangeData) => void;
  
  // Server to client events
  'ai-response': (data: AIResponseData) => void;
  'error': (data: WebSocketErrorData) => void;
  'status': (data: StatusData) => void;
  'session-joined': (data: SessionJoinedData) => void;
  'language-changed': (data: LanguageChangedData) => void;
  'language-detected': (data: LanguageDetectedData) => void;
  'pong': () => void;
}

export interface VoiceInputData {
  audioBuffer: Buffer;
  sessionId: string;
  timestamp: number;
  metadata?: {
    format: string;
    duration: number;
    sampleRate: number;
  };
}

export interface AIResponseData {
  text: string;
  audioBuffer?: Buffer;
  sessionId: string;
  timestamp: number;
  confidence?: number;
  processingTime: number;
}

export interface WebSocketErrorData {
  code: string;
  message: string;
  sessionId?: string;
  timestamp: number;
  requestId: string;
}

export interface StatusData {
  status: 'listening' | 'processing' | 'speaking' | 'idle' | 'error';
  sessionId: string;
  timestamp: number;
  details?: string;
}

export interface JoinSessionData {
  sessionId?: string;
  userPreferences?: {
    voiceSpeed?: number;
    language?: string;
    accessibilityMode?: boolean;
  };
}

export interface SessionJoinedData {
  sessionId: string;
  timestamp: number;
  status: string;
}

export interface ConnectionState {
  sessionId: string;
  userId?: string;
  connectedAt: Date;
  lastActivity: Date;
  status: 'connected' | 'idle' | 'processing' | 'disconnected';
  preferences?: {
    voiceSpeed?: number;
    language?: string;
    accessibilityMode?: boolean;
  };
}

export interface SessionManager {
  createSession(socketId: string): string;
  getSession(sessionId: string): ConnectionState | undefined;
  updateSession(sessionId: string, updates: Partial<ConnectionState>): void;
  removeSession(sessionId: string): void;
  cleanupInactiveSessions(): void;
  getActiveSessionsCount(): number;
}

export interface LanguageChangeData {
  languageCode: string;
  sessionId: string;
  timestamp: number;
  autoDetected?: boolean;
}

export interface LanguageChangedData {
  languageCode: string;
  sessionId: string;
  timestamp: number;
  languageName: string;
}

export interface LanguageDetectedData {
  detectedLanguageCode: string;
  detectedLanguageName: string;
  sessionId: string;
  timestamp: number;
  confidence: number;
  autoSwitched: boolean;
}