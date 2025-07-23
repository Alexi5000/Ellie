/**
 * Language Detection Service - Provides language detection and management for multi-language support
 * Requirements: 16.1 - Multi-language support
 */

import { logger } from './loggerService';

// Supported languages with their ISO codes
export interface SupportedLanguage {
  code: string;
  name: string;
  flag: string;
  whisperCode?: string; // OpenAI Whisper language code if different from ISO
}

export class LanguageDetectionService {
  // List of supported languages
  private readonly SUPPORTED_LANGUAGES: SupportedLanguage[] = [
    { code: 'en', name: 'English', flag: '🇺🇸', whisperCode: 'en' },
    { code: 'es', name: 'Español', flag: '🇪🇸', whisperCode: 'es' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', whisperCode: 'fr' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', whisperCode: 'de' },
    { code: 'zh', name: '中文', flag: '🇨🇳', whisperCode: 'zh' }
  ];

  // Common words and phrases for language detection
  private readonly LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
    en: [
      /\b(hello|hi|hey|good morning|thank you|please|yes|no|help|how are you)\b/i,
      /\b(what|when|where|who|why|how|which|whose|whom)\b/i,
      /\b(the|a|an|this|that|these|those|it|is|am|are|was|were)\b/i
    ],
    es: [
      /\b(hola|buenos días|gracias|por favor|sí|no|ayuda|cómo estás)\b/i,
      /\b(qué|cuándo|dónde|quién|por qué|cómo|cuál|cuáles|quiénes)\b/i,
      /\b(el|la|los|las|un|una|unos|unas|este|esta|estos|estas|es|son|era|eran)\b/i
    ],
    fr: [
      /\b(bonjour|salut|merci|s'il vous plaît|oui|non|aide|comment allez-vous)\b/i,
      /\b(quoi|quand|où|qui|pourquoi|comment|quel|quelle|quels|quelles)\b/i,
      /\b(le|la|les|un|une|des|ce|cette|ces|il|elle|est|sont|était|étaient)\b/i
    ],
    de: [
      /\b(hallo|guten tag|danke|bitte|ja|nein|hilfe|wie geht es dir)\b/i,
      /\b(was|wann|wo|wer|warum|wie|welche|welcher|welches|wessen)\b/i,
      /\b(der|die|das|ein|eine|dieser|diese|dieses|es|ist|sind|war|waren)\b/i
    ],
    zh: [
      /[你我他她它们您好谢谢请是的不帮助]/,
      /[什么时候哪里谁为什么怎么哪一个]/,
      /[的了吗呢吧啊呀]/ 
    ]
  };

  constructor() {
    logger.info('Language Detection Service initialized', {
      service: 'language',
      supportedLanguages: this.SUPPORTED_LANGUAGES.map(lang => lang.code)
    });
  }

  /**
   * Get list of supported languages
   * @returns Array of supported languages
   */
  public getSupportedLanguages(): SupportedLanguage[] {
    return [...this.SUPPORTED_LANGUAGES];
  }

  /**
   * Check if a language is supported
   * @param languageCode - ISO language code
   * @returns Boolean indicating if language is supported
   */
  public isLanguageSupported(languageCode: string): boolean {
    return this.SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode);
  }

  /**
   * Get Whisper API language code from ISO code
   * @param isoCode - ISO language code
   * @returns Whisper API language code or null if not supported
   */
  public getWhisperLanguageCode(isoCode: string): string | null {
    const language = this.SUPPORTED_LANGUAGES.find(lang => lang.code === isoCode);
    return language?.whisperCode || isoCode || null;
  }

  /**
   * Detect language from text using pattern matching
   * @param text - Text to analyze
   * @returns Detected language code or null if detection failed
   */
  public detectLanguageFromText(text: string): string | null {
    if (!text || text.trim().length === 0) {
      return null;
    }

    // Calculate confidence scores for each language
    const scores: Record<string, number> = {};
    
    for (const [langCode, patterns] of Object.entries(this.LANGUAGE_PATTERNS)) {
      scores[langCode] = 0;
      
      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
          scores[langCode] += matches.length;
        }
      }
    }

    // Find language with highest score
    let highestScore = 0;
    let detectedLanguage: string | null = null;

    for (const [langCode, score] of Object.entries(scores)) {
      if (score > highestScore) {
        highestScore = score;
        detectedLanguage = langCode;
      }
    }

    // Require minimum confidence
    if (highestScore < 2) {
      return null;
    }

    logger.debug('Language detected from text', {
      service: 'language',
      detectedLanguage,
      confidence: highestScore,
      textSample: text.substring(0, 50) + (text.length > 50 ? '...' : '')
    });

    return detectedLanguage;
  }

  /**
   * Get language details by code
   * @param languageCode - ISO language code
   * @returns Language details or null if not supported
   */
  public getLanguageDetails(languageCode: string): SupportedLanguage | null {
    return this.SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode) || null;
  }

  /**
   * Get default language
   * @returns Default language code
   */
  public getDefaultLanguage(): string {
    return 'en';
  }
}

// Export singleton instance
export const languageDetectionService = new LanguageDetectionService();