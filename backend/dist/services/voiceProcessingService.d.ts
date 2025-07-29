import { AudioInput } from '../types';
export declare class VoiceProcessingService {
    private openai;
    private readonly SUPPORTED_FORMATS;
    private readonly MAX_FILE_SIZE;
    private readonly ttsCache;
    private readonly CACHE_DURATION;
    constructor();
    validateAudioFormat(file: Express.Multer.File): boolean;
    processAudioInput(audioBuffer: Buffer, filename?: string, language?: string): Promise<string>;
    private getContentType;
    convertTextToSpeech(text: string, voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer', speed?: number, language?: string): Promise<Buffer>;
    private getCachedAudio;
    private setCachedAudio;
    private cleanupExpiredCache;
    clearTTSCache(): void;
    getCacheStats(): {
        size: number;
        keys: string[];
    };
    createAudioInput(file: Express.Multer.File): AudioInput;
}
//# sourceMappingURL=voiceProcessingService.d.ts.map