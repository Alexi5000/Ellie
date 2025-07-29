"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceProcessingService = void 0;
const openai_1 = __importDefault(require("openai"));
const types_1 = require("../types");
const errorHandler_1 = require("../utils/errorHandler");
const cacheService_1 = require("./cacheService");
class VoiceProcessingService {
    constructor() {
        this.SUPPORTED_FORMATS = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'];
        this.MAX_FILE_SIZE = 25 * 1024 * 1024;
        this.ttsCache = new Map();
        this.CACHE_DURATION = 60 * 60 * 1000;
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    validateAudioFormat(file) {
        if (!file) {
            return false;
        }
        if (file.size > this.MAX_FILE_SIZE) {
            return false;
        }
        const mimeType = file.mimetype.toLowerCase();
        const validMimeTypes = [
            'audio/mpeg',
            'audio/mp4',
            'audio/wav',
            'audio/webm',
            'audio/m4a',
            'video/mp4',
            'video/webm'
        ];
        if (!validMimeTypes.includes(mimeType)) {
            return false;
        }
        if (file.originalname) {
            const extension = file.originalname.split('.').pop()?.toLowerCase();
            if (extension && !this.SUPPORTED_FORMATS.includes(extension)) {
                return false;
            }
        }
        return true;
    }
    async processAudioInput(audioBuffer, filename, language) {
        const startTime = Date.now();
        try {
            const audioFile = new File([audioBuffer], filename || 'audio.wav', {
                type: this.getContentType(filename)
            });
            const transcription = await this.openai.audio.transcriptions.create({
                file: audioFile,
                model: 'whisper-1',
                language: language,
                response_format: 'text'
            });
            const processingTime = Date.now() - startTime;
            console.log(`Audio transcription completed in ${processingTime}ms${language ? ` (language: ${language})` : ' (auto-detected language)'}`);
            return transcription.trim();
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            console.error('Audio processing failed:', error);
            if (error instanceof Error) {
                if (error.message.includes('rate limit')) {
                    throw (0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.RATE_LIMIT_EXCEEDED, 'Speech-to-text service rate limit exceeded. Please try again later.', { processingTime, originalError: error.message });
                }
                if (error.message.includes('invalid file format')) {
                    throw (0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.INVALID_AUDIO_FORMAT, 'Invalid audio format. Please use MP3, WAV, or M4A format.', { processingTime, originalError: error.message });
                }
                if (error.message.includes('file too large')) {
                    throw (0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.AUDIO_TOO_LARGE, 'Audio file is too large. Maximum size is 25MB.', { processingTime, originalError: error.message });
                }
            }
            throw (0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.AUDIO_PROCESSING_FAILED, 'Failed to process audio input. Please try again.', { processingTime, originalError: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    getContentType(filename) {
        if (!filename)
            return 'audio/wav';
        const extension = filename.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'mp3':
            case 'mpeg':
            case 'mpga':
                return 'audio/mpeg';
            case 'wav':
                return 'audio/wav';
            case 'm4a':
                return 'audio/m4a';
            case 'mp4':
                return 'video/mp4';
            case 'webm':
                return 'audio/webm';
            default:
                return 'audio/wav';
        }
    }
    async convertTextToSpeech(text, voice = 'alloy', speed = 1.0, language) {
        const startTime = Date.now();
        if (!text || text.trim().length === 0) {
            throw (0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.INVALID_INPUT, 'Text input is required for speech synthesis.', { text });
        }
        if (text.length > 4096) {
            throw (0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.INVALID_INPUT, 'Text is too long. Maximum length is 4096 characters.', { textLength: text.length });
        }
        if (speed < 0.25 || speed > 4.0) {
            throw (0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.INVALID_INPUT, 'Speed must be between 0.25 and 4.0.', { speed });
        }
        const cachedAudio = await cacheService_1.cacheService.getCachedTTSAudio(text, voice, speed, language);
        if (cachedAudio) {
            console.log(`TTS Redis cache hit for text: ${text.substring(0, 50)}...`);
            return cachedAudio;
        }
        const cacheKey = `${text}-${voice}-${speed}-${language || 'default'}`;
        const localCached = this.getCachedAudio(cacheKey);
        if (localCached) {
            console.log(`TTS local cache hit for key: ${cacheKey.substring(0, 50)}...`);
            await cacheService_1.cacheService.cacheTTSAudio(text, voice, speed, localCached, { language });
            return localCached;
        }
        try {
            const mp3Response = await this.openai.audio.speech.create({
                model: 'tts-1',
                voice: voice,
                input: text,
                response_format: 'mp3',
                speed: speed
            });
            const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());
            const processingTime = Date.now() - startTime;
            console.log(`Text-to-speech completed in ${processingTime}ms`);
            this.setCachedAudio(cacheKey, audioBuffer);
            await cacheService_1.cacheService.cacheTTSAudio(text, voice, speed, audioBuffer, {
                ttl: 7200,
                language: language
            });
            return audioBuffer;
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            console.error('Text-to-speech failed:', error);
            if (error instanceof Error) {
                if (error.message.includes('rate limit')) {
                    throw (0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.RATE_LIMIT_EXCEEDED, 'Text-to-speech service rate limit exceeded. Please try again later.', { processingTime, originalError: error.message });
                }
                if (error.message.includes('invalid voice')) {
                    throw (0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.INVALID_INPUT, 'Invalid voice selection. Please use alloy, echo, fable, onyx, nova, or shimmer.', { processingTime, voice, originalError: error.message });
                }
                if (error.message.includes('content policy')) {
                    throw (0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.INAPPROPRIATE_CONTENT, 'Text content violates content policy. Please modify your message.', { processingTime, originalError: error.message });
                }
            }
            throw (0, errorHandler_1.createErrorResponse)(types_1.ERROR_CODES.AUDIO_PROCESSING_FAILED, 'Failed to convert text to speech. Please try again.', { processingTime, originalError: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    getCachedAudio(cacheKey) {
        const cached = this.ttsCache.get(cacheKey);
        if (!cached) {
            return null;
        }
        if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
            this.ttsCache.delete(cacheKey);
            return null;
        }
        return cached.buffer;
    }
    setCachedAudio(cacheKey, buffer) {
        if (this.ttsCache.size > 100) {
            this.cleanupExpiredCache();
        }
        this.ttsCache.set(cacheKey, {
            buffer,
            timestamp: Date.now()
        });
    }
    cleanupExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.ttsCache.entries()) {
            if (now - value.timestamp > this.CACHE_DURATION) {
                this.ttsCache.delete(key);
            }
        }
    }
    clearTTSCache() {
        this.ttsCache.clear();
    }
    getCacheStats() {
        return {
            size: this.ttsCache.size,
            keys: Array.from(this.ttsCache.keys()).map(key => key.substring(0, 50) + '...')
        };
    }
    createAudioInput(file) {
        return {
            buffer: file.buffer,
            format: file.mimetype,
            duration: 0,
            sampleRate: 0
        };
    }
}
exports.VoiceProcessingService = VoiceProcessingService;
//# sourceMappingURL=voiceProcessingService.js.map