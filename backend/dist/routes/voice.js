"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const voiceProcessingService_1 = require("../services/voiceProcessingService");
const aiResponseService_1 = require("../services/aiResponseService");
const errorHandler_1 = require("../utils/errorHandler");
const types_1 = require("../types");
const loggerService_1 = require("../services/loggerService");
const rateLimitService_1 = require("../services/rateLimitService");
const fallbackService_1 = require("../services/fallbackService");
const uuid_1 = require("uuid");
const router = express_1.default.Router();
const voiceProcessingService = new voiceProcessingService_1.VoiceProcessingService();
const aiResponseService = new aiResponseService_1.AIResponseService();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'audio/mpeg',
            'audio/mp4',
            'audio/wav',
            'audio/webm',
            'audio/m4a',
            'video/mp4',
            'video/webm'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid audio format. Please use MP3, WAV, M4A, or WebM format.'));
        }
    }
});
const voiceProcessingLimiter = rateLimitService_1.rateLimitService.createVoiceRateLimiter();
router.post('/process', voiceProcessingLimiter, upload.single('audio'), async (req, res) => {
    const startTime = Date.now();
    const requestId = req.requestId || (0, uuid_1.v4)();
    try {
        if (!req.file) {
            const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(types_1.ERROR_CODES.MISSING_REQUIRED_FIELD, 'Audio file is required. Please upload an audio file.', undefined, requestId);
            return res.status(400).json(errorResponse);
        }
        if (!voiceProcessingService.validateAudioFormat(req.file)) {
            const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(types_1.ERROR_CODES.INVALID_AUDIO_FORMAT, 'Invalid audio format or file too large. Please use MP3, WAV, M4A, or WebM format under 25MB.', {
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                originalName: req.file.originalname
            }, requestId);
            return res.status(400).json(errorResponse);
        }
        const sessionId = req.body.sessionId || (0, uuid_1.v4)();
        const conversationHistory = req.body.conversationHistory ?
            JSON.parse(req.body.conversationHistory) : [];
        const userPreferences = {
            voiceSpeed: parseFloat(req.body.voiceSpeed) || 1.0,
            language: req.body.language || 'en',
            accessibilityMode: req.body.accessibilityMode === 'true'
        };
        const context = {
            sessionId,
            userId: req.body.userId,
            conversationHistory,
            userPreferences,
            legalDisclaimer: req.body.legalDisclaimer === 'true'
        };
        loggerService_1.logger.info('Processing voice input', {
            requestId,
            sessionId,
            service: 'voice-processing',
            metadata: {
                audioFileSize: req.file.size,
                audioFormat: req.file.mimetype,
                voiceSpeed: userPreferences.voiceSpeed,
                language: userPreferences.language
            }
        });
        let transcribedText;
        let aiResponse;
        let audioBuffer;
        let transcriptionTime = 0;
        let aiResponseTime = 0;
        let ttsTime = 0;
        try {
            const transcriptionStart = Date.now();
            transcribedText = await voiceProcessingService.processAudioInput(req.file.buffer, req.file.originalname);
            transcriptionTime = Date.now() - transcriptionStart;
            loggerService_1.logger.logVoiceProcessing('transcription', transcriptionTime, true, requestId, sessionId, undefined, {
                textLength: transcribedText.length,
                audioFileSize: req.file.size
            });
            fallbackService_1.fallbackService.recordServiceCall('openai-whisper', true, transcriptionTime);
        }
        catch (error) {
            transcriptionTime = Date.now() - startTime;
            loggerService_1.logger.logVoiceProcessing('transcription', transcriptionTime, false, requestId, sessionId, error);
            fallbackService_1.fallbackService.recordServiceCall('openai-whisper', false, transcriptionTime, error);
            const fallbackResponse = fallbackService_1.fallbackService.getFallbackForTranscription(error, requestId);
            transcribedText = "I'm sorry, I couldn't understand your audio. Could you please try again?";
        }
        try {
            const aiStart = Date.now();
            aiResponse = await aiResponseService.generateResponse(transcribedText, context);
            aiResponseTime = Date.now() - aiStart;
            loggerService_1.logger.logVoiceProcessing('ai-response', aiResponseTime, true, requestId, sessionId, undefined, {
                inputLength: transcribedText.length,
                outputLength: aiResponse.length
            });
            fallbackService_1.fallbackService.recordServiceCall('groq', true, aiResponseTime);
            fallbackService_1.fallbackService.recordServiceCall('openai-gpt', true, aiResponseTime);
        }
        catch (error) {
            aiResponseTime = Date.now() - (startTime + transcriptionTime);
            loggerService_1.logger.logVoiceProcessing('ai-response', aiResponseTime, false, requestId, sessionId, error);
            fallbackService_1.fallbackService.recordServiceCall('groq', false, aiResponseTime, error);
            fallbackService_1.fallbackService.recordServiceCall('openai-gpt', false, aiResponseTime, error);
            const fallbackResponse = fallbackService_1.fallbackService.getFallbackForAI(transcribedText, error, requestId);
            aiResponse = fallbackResponse.text;
        }
        try {
            const ttsStart = Date.now();
            audioBuffer = await voiceProcessingService.convertTextToSpeech(aiResponse, 'alloy', userPreferences.voiceSpeed);
            ttsTime = Date.now() - ttsStart;
            loggerService_1.logger.logVoiceProcessing('tts', ttsTime, true, requestId, sessionId, undefined, {
                textLength: aiResponse.length,
                audioBufferSize: audioBuffer.length,
                voice: 'alloy',
                speed: userPreferences.voiceSpeed
            });
            fallbackService_1.fallbackService.recordServiceCall('openai-tts', true, ttsTime);
        }
        catch (error) {
            ttsTime = Date.now() - (startTime + transcriptionTime + aiResponseTime);
            loggerService_1.logger.logVoiceProcessing('tts', ttsTime, false, requestId, sessionId, error);
            fallbackService_1.fallbackService.recordServiceCall('openai-tts', false, ttsTime, error);
            audioBuffer = Buffer.from('');
            loggerService_1.logger.warn('TTS failed, returning text-only response', {
                requestId,
                sessionId,
                service: 'voice-processing',
                error: {
                    message: error.message
                }
            });
        }
        const totalProcessingTime = Date.now() - startTime;
        const response = {
            success: true,
            data: {
                transcribedText,
                aiResponse,
                audioBuffer: audioBuffer.toString('base64'),
                sessionId,
                processingTime: totalProcessingTime
            },
            metadata: {
                requestId,
                timestamp: new Date().toISOString(),
                audioFileSize: req.file.size,
                audioFormat: req.file.mimetype,
                responseAudioSize: audioBuffer.length
            }
        };
        loggerService_1.logger.info('Voice processing completed successfully', {
            requestId,
            sessionId,
            service: 'voice-processing',
            duration: totalProcessingTime,
            metadata: {
                transcriptionTime,
                aiResponseTime,
                ttsTime,
                totalTime: totalProcessingTime,
                audioBufferSize: audioBuffer.length,
                hasAudio: audioBuffer.length > 0
            }
        });
        return res.status(200).json(response);
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        loggerService_1.logger.error('Voice processing failed with unhandled error', {
            requestId,
            service: 'voice-processing',
            duration: processingTime,
            error: {
                message: error.message,
                stack: error.stack
            },
            metadata: {
                audioFileSize: req.file?.size,
                audioFormat: req.file?.mimetype
            }
        });
        if (error && typeof error === 'object' && 'error' in error) {
            return res.status(400).json(error);
        }
        if (error instanceof multer_1.default.MulterError) {
            let errorResponse;
            if (error.code === 'LIMIT_FILE_SIZE') {
                errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(types_1.ERROR_CODES.AUDIO_TOO_LARGE, 'Audio file is too large. Maximum size is 25MB.', { fileSize: req.file?.size, limit: 25 * 1024 * 1024 }, requestId);
            }
            else {
                errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(types_1.ERROR_CODES.INVALID_INPUT, 'File upload error: ' + error.message, { multerCode: error.code }, requestId);
            }
            return res.status(400).json(errorResponse);
        }
        const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(types_1.ERROR_CODES.AUDIO_PROCESSING_FAILED, 'Failed to process voice input. Please try again.', {
            processingTime,
            originalError: error instanceof Error ? error.message : 'Unknown error'
        }, requestId);
        return res.status(500).json(errorResponse);
    }
});
router.get('/synthesize/:text', rateLimitService_1.rateLimitService.createApiRateLimiter(), async (req, res) => {
    const startTime = Date.now();
    const requestId = req.requestId || (0, uuid_1.v4)();
    try {
        const text = decodeURIComponent(req.params.text);
        if (!text || text.trim().length === 0) {
            const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(types_1.ERROR_CODES.INVALID_INPUT, 'Text parameter is required for speech synthesis.', undefined, requestId);
            return res.status(400).json(errorResponse);
        }
        if (text.length > 4096) {
            const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(types_1.ERROR_CODES.INVALID_INPUT, 'Text is too long. Maximum length is 4096 characters.', { textLength: text.length, maxLength: 4096 }, requestId);
            return res.status(400).json(errorResponse);
        }
        const voice = req.query.voice || 'alloy';
        const speed = parseFloat(req.query.speed) || 1.0;
        const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
        if (!validVoices.includes(voice)) {
            const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(types_1.ERROR_CODES.INVALID_INPUT, 'Invalid voice parameter. Valid options: alloy, echo, fable, onyx, nova, shimmer.', { voice, validVoices }, requestId);
            return res.status(400).json(errorResponse);
        }
        if (speed < 0.25 || speed > 4.0) {
            const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(types_1.ERROR_CODES.INVALID_INPUT, 'Speed must be between 0.25 and 4.0.', { speed, minSpeed: 0.25, maxSpeed: 4.0 }, requestId);
            return res.status(400).json(errorResponse);
        }
        loggerService_1.logger.info('Starting text-to-speech synthesis', {
            requestId,
            service: 'tts',
            metadata: {
                textLength: text.length,
                voice,
                speed,
                textPreview: text.substring(0, 100)
            }
        });
        let audioBuffer;
        try {
            audioBuffer = await voiceProcessingService.convertTextToSpeech(text, voice, speed);
            const processingTime = Date.now() - startTime;
            loggerService_1.logger.logVoiceProcessing('tts', processingTime, true, requestId, undefined, undefined, {
                textLength: text.length,
                audioBufferSize: audioBuffer.length,
                voice,
                speed
            });
            fallbackService_1.fallbackService.recordServiceCall('openai-tts', true, processingTime);
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            loggerService_1.logger.logVoiceProcessing('tts', processingTime, false, requestId, undefined, error);
            fallbackService_1.fallbackService.recordServiceCall('openai-tts', false, processingTime, error);
            throw error;
        }
        const processingTime = Date.now() - startTime;
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length.toString(),
            'Cache-Control': 'public, max-age=3600',
            'X-Processing-Time': processingTime.toString(),
            'X-Request-ID': requestId
        });
        return res.status(200).send(audioBuffer);
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        loggerService_1.logger.error('Text-to-speech synthesis failed', {
            requestId,
            service: 'tts',
            duration: processingTime,
            error: {
                message: error.message,
                stack: error.stack
            },
            metadata: {
                textLength: req.params.text?.length,
                voice: req.query.voice,
                speed: req.query.speed
            }
        });
        if (error && typeof error === 'object' && 'error' in error) {
            return res.status(400).json(error);
        }
        const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(types_1.ERROR_CODES.AUDIO_PROCESSING_FAILED, 'Failed to convert text to speech. Please try again.', {
            processingTime,
            originalError: error instanceof Error ? error.message : 'Unknown error'
        }, requestId);
        return res.status(500).json(errorResponse);
    }
});
router.get('/cache-stats', (req, res) => {
    try {
        const stats = voiceProcessingService.getCacheStats();
        res.status(200).json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const errorResponse = errorHandler_1.ErrorHandler.createErrorResponse(types_1.ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to retrieve cache statistics.', { originalError: error instanceof Error ? error.message : 'Unknown error' }, req.requestId);
        res.status(500).json(errorResponse);
    }
});
exports.default = router;
//# sourceMappingURL=voice.js.map