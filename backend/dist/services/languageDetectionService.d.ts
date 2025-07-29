export interface SupportedLanguage {
    code: string;
    name: string;
    flag: string;
    whisperCode?: string;
}
export declare class LanguageDetectionService {
    private readonly SUPPORTED_LANGUAGES;
    private readonly LANGUAGE_PATTERNS;
    constructor();
    getSupportedLanguages(): SupportedLanguage[];
    isLanguageSupported(languageCode: string): boolean;
    getWhisperLanguageCode(isoCode: string): string | null;
    detectLanguageFromText(text: string): string | null;
    getLanguageDetails(languageCode: string): SupportedLanguage | null;
    getDefaultLanguage(): string;
}
export declare const languageDetectionService: LanguageDetectionService;
//# sourceMappingURL=languageDetectionService.d.ts.map