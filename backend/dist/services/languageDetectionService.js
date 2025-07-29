"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.languageDetectionService = exports.LanguageDetectionService = void 0;
const loggerService_1 = require("./loggerService");
class LanguageDetectionService {
    constructor() {
        this.SUPPORTED_LANGUAGES = [
            { code: 'en', name: 'English', flag: '🇺🇸', whisperCode: 'en' },
            { code: 'es', name: 'Español', flag: '🇪🇸', whisperCode: 'es' },
            { code: 'fr', name: 'Français', flag: '🇫🇷', whisperCode: 'fr' },
            { code: 'de', name: 'Deutsch', flag: '🇩🇪', whisperCode: 'de' },
            { code: 'zh', name: '中文', flag: '🇨🇳', whisperCode: 'zh' }
        ];
        this.LANGUAGE_PATTERNS = {
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
        loggerService_1.logger.info('Language Detection Service initialized', {
            service: 'language',
            metadata: {
                supportedLanguages: this.SUPPORTED_LANGUAGES.map(lang => lang.code)
            }
        });
    }
    getSupportedLanguages() {
        return [...this.SUPPORTED_LANGUAGES];
    }
    isLanguageSupported(languageCode) {
        return this.SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode);
    }
    getWhisperLanguageCode(isoCode) {
        const language = this.SUPPORTED_LANGUAGES.find(lang => lang.code === isoCode);
        return language?.whisperCode || isoCode || null;
    }
    detectLanguageFromText(text) {
        if (!text || text.trim().length === 0) {
            return null;
        }
        const scores = {};
        for (const [langCode, patterns] of Object.entries(this.LANGUAGE_PATTERNS)) {
            scores[langCode] = 0;
            for (const pattern of patterns) {
                const matches = text.match(pattern);
                if (matches) {
                    scores[langCode] += matches.length;
                }
            }
        }
        let highestScore = 0;
        let detectedLanguage = null;
        for (const [langCode, score] of Object.entries(scores)) {
            if (score > highestScore) {
                highestScore = score;
                detectedLanguage = langCode;
            }
        }
        if (highestScore < 2) {
            return null;
        }
        loggerService_1.logger.debug('Language detected from text', {
            service: 'language',
            metadata: {
                detectedLanguage,
                confidence: highestScore,
                textSample: text.substring(0, 50) + (text.length > 50 ? '...' : '')
            }
        });
        return detectedLanguage;
    }
    getLanguageDetails(languageCode) {
        return this.SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode) || null;
    }
    getDefaultLanguage() {
        return 'en';
    }
}
exports.LanguageDetectionService = LanguageDetectionService;
exports.languageDetectionService = new LanguageDetectionService();
//# sourceMappingURL=languageDetectionService.js.map