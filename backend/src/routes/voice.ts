/**
 * Voice Processing API Routes
 * Requirements: 1.3, 5.1, 5.2, 1.4, 5.3
 */

import express from 'express';
import multer from 'multer';
import { VoiceProcessingService } from '../services/voiceProcessingService';
import { AIResponseService } from '../services/aiResponseService';
import { ErrorHandler } from '../utils/errorHandler';
import { ERROR_CODES, ConversationContext, Message, UserPreferences } from '../types';
import { logger } from '../services/loggerService';
import { rateLimitService } from '../services/rateLimitService';
import { fallbackService } from '../services/fallbackService';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Initialize services - will be mocked in tests
const voiceProcessingService = new VoiceProcessingService();
const aiResponseService = new AIResponseService();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for OpenAI Whisper
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Validate file type
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
    } else {
      cb(new Error('Invalid audio format. Please use MP3, WAV, M4A, or WebM format.'));
    }
  }
});

// Enhanced rate limiting for voice processing endpoint
const voiceProcessingLimiter = rateLimitService.createVoiceRateLimiter();

/**
 * POST /api/voice/process
 * Process audio input through speech-to-text and AI response generation
 * Requirements: 1.3, 5.1, 5.2
 */
router.post('/process', voiceProcessingLimiter, upload.single('audio'), async (req, res) => {
  const startTime = Date.now();
  const requestId = req.requestId || uuidv4();

  try {
    // Validate audio file upload
    if (!req.file) {
      const errorResponse = ErrorHandler.createErrorResponse(
        ERROR_CODES.MISSING_REQUIRED_FIELD,
        'Audio file is required. Please upload an audio file.',
        undefined,
        requestId
      );
      return res.status(400).json(errorResponse);
    }

    // Validate audio format
    if (!voiceProcessingService.validateAudioFormat(req.file)) {
      const errorResponse = ErrorHandler.createErrorResponse(
        ERROR_CODES.INVALID_AUDIO_FORMAT,
        'Invalid audio format or file too large. Please use MP3, WAV, M4A, or WebM format under 25MB.',
        { 
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          originalName: req.file.originalname
        },
        requestId
      );
      return res.status(400).json(errorResponse);
    }

    // Extract conversation context from request body
    const sessionId = req.body.sessionId || uuidv4();
    const conversationHistory: Message[] = req.body.conversationHistory ? 
      JSON.parse(req.body.conversationHistory) : [];
    
    const userPreferences: UserPreferences = {
      voiceSpeed: parseFloat(req.body.voiceSpeed) || 1.0,
      language: req.body.language || 'en',
      accessibilityMode: req.body.accessibilityMode === 'true'
    };

    const context: ConversationContext = {
      sessionId,
      userId: req.body.userId,
      conversationHistory,
      userPreferences,
      legalDisclaimer: req.body.legalDisclaimer === 'true'
    };

    logger.info('Processing voice input', {
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

    let transcribedText: string;
    let aiResponse: string;
    let audioBuffer: Buffer;
    let transcriptionTime = 0;
    let aiResponseTime = 0;
    let ttsTime = 0;

    // Step 1: Convert speech to text with fallback handling
    try {
      const transcriptionStart = Date.now();
      transcribedText = await voiceProcessingService.processAudioInput(
        req.file.buffer,
        req.file.originalname
      );
      transcriptionTime = Date.now() - transcriptionStart;

      logger.logVoiceProcessing('transcription', transcriptionTime, true, requestId, sessionId, undefined, {
        textLength: transcribedText.length,
        audioFileSize: req.file.size
      });

      fallbackService.recordServiceCall('openai-whisper', true, transcriptionTime);
    } catch (error) {
      transcriptionTime = Date.now() - startTime;
      logger.logVoiceProcessing('transcription', transcriptionTime, false, requestId, sessionId, error as Error);
      
      fallbackService.recordServiceCall('openai-whisper', false, transcriptionTime, error as Error);
      
      // Use fallback for transcription failure
      const fallbackResponse = fallbackService.getFallbackForTranscription(error as Error, requestId);
      transcribedText = "I'm sorry, I couldn't understand your audio. Could you please try again?";
    }

    // Step 2: Generate AI response with fallback handling
    try {
      const aiStart = Date.now();
      aiResponse = await aiResponseService.generateResponse(transcribedText, context);
      aiResponseTime = Date.now() - aiStart;

      logger.logVoiceProcessing('ai-response', aiResponseTime, true, requestId, sessionId, undefined, {
        inputLength: transcribedText.length,
        outputLength: aiResponse.length
      });

      // Record success for both Groq and OpenAI (the service will determine which was used)
      fallbackService.recordServiceCall('groq', true, aiResponseTime);
      fallbackService.recordServiceCall('openai-gpt', true, aiResponseTime);
    } catch (error) {
      aiResponseTime = Date.now() - (startTime + transcriptionTime);
      logger.logVoiceProcessing('ai-response', aiResponseTime, false, requestId, sessionId, error as Error);
      
      fallbackService.recordServiceCall('groq', false, aiResponseTime, error as Error);
      fallbackService.recordServiceCall('openai-gpt', false, aiResponseTime, error as Error);
      
      // Use fallback for AI response failure
      const fallbackResponse = fallbackService.getFallbackForAI(transcribedText, error as Error, requestId);
      aiResponse = fallbackResponse.text;
    }

    // Step 3: Convert AI response to speech with fallback handling
    try {
      const ttsStart = Date.now();
      audioBuffer = await voiceProcessingService.convertTextToSpeech(
        aiResponse,
        'alloy', // Default voice, can be made configurable
        userPreferences.voiceSpeed
      );
      ttsTime = Date.now() - ttsStart;

      logger.logVoiceProcessing('tts', ttsTime, true, requestId, sessionId, undefined, {
        textLength: aiResponse.length,
        audioBufferSize: audioBuffer.length,
        voice: 'alloy',
        speed: userPreferences.voiceSpeed
      });

      fallbackService.recordServiceCall('openai-tts', true, ttsTime);
    } catch (error) {
      ttsTime = Date.now() - (startTime + transcriptionTime + aiResponseTime);
      logger.logVoiceProcessing('tts', ttsTime, false, requestId, sessionId, error as Error);
      
      fallbackService.recordServiceCall('openai-tts', false, ttsTime, error as Error);
      
      // For TTS failure, we can still return the text response
      audioBuffer = Buffer.from(''); // Empty buffer indicates TTS failure
      
      logger.warn('TTS failed, returning text-only response', {
        requestId,
        sessionId,
        service: 'voice-processing',
        error: {
          message: (error as Error).message
        }
      });
    }

    const totalProcessingTime = Date.now() - startTime;

    // Prepare response
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

    logger.info('Voice processing completed successfully', {
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

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('Voice processing failed with unhandled error', {
      requestId,
      service: 'voice-processing',
      duration: processingTime,
      error: {
        message: (error as Error).message,
        stack: (error as Error).stack
      },
      metadata: {
        audioFileSize: req.file?.size,
        audioFormat: req.file?.mimetype
      }
    });

    // Handle specific error types
    if (error && typeof error === 'object' && 'error' in error) {
      // Already formatted error response
      return res.status(400).json(error);
    }

    // Handle multer errors
    if (error instanceof multer.MulterError) {
      let errorResponse;
      if (error.code === 'LIMIT_FILE_SIZE') {
        errorResponse = ErrorHandler.createErrorResponse(
          ERROR_CODES.AUDIO_TOO_LARGE,
          'Audio file is too large. Maximum size is 25MB.',
          { fileSize: req.file?.size, limit: 25 * 1024 * 1024 },
          requestId
        );
      } else {
        errorResponse = ErrorHandler.createErrorResponse(
          ERROR_CODES.INVALID_INPUT,
          'File upload error: ' + error.message,
          { multerCode: error.code },
          requestId
        );
      }
      return res.status(400).json(errorResponse);
    }

    // Handle file filter errors (invalid audio format)
    if (error instanceof Error && error.message.includes('Invalid audio format')) {
      const errorResponse = ErrorHandler.createErrorResponse(
        ERROR_CODES.INVALID_AUDIO_FORMAT,
        error.message,
        { 
          fileSize: req.file?.size,
          mimeType: req.file?.mimetype,
          originalName: req.file?.originalname
        },
        requestId
      );
      return res.status(400).json(errorResponse);
    }

    // Generic error handling
    const errorResponse = ErrorHandler.createErrorResponse(
      ERROR_CODES.AUDIO_PROCESSING_FAILED,
      'Failed to process voice input. Please try again.',
      { 
        processingTime,
        originalError: error instanceof Error ? error.message : 'Unknown error'
      },
      requestId
    );

    return res.status(500).json(errorResponse);
  }
});

/**
 * GET /api/voice/synthesize/:text
 * Convert text to speech
 * Requirements: 1.4, 5.3
 */
router.get('/synthesize/:text', rateLimitService.createApiRateLimiter(), async (req, res) => {
  const startTime = Date.now();
  const requestId = req.requestId || uuidv4();

  try {
    const text = decodeURIComponent(req.params.text);
    
    // Validate text input
    if (!text || text.trim().length === 0) {
      const errorResponse = ErrorHandler.createErrorResponse(
        ERROR_CODES.INVALID_INPUT,
        'Text parameter is required for speech synthesis.',
        undefined,
        requestId
      );
      return res.status(400).json(errorResponse);
    }

    if (text.length > 4096) {
      const errorResponse = ErrorHandler.createErrorResponse(
        ERROR_CODES.INVALID_INPUT,
        'Text is too long. Maximum length is 4096 characters.',
        { textLength: text.length, maxLength: 4096 },
        requestId
      );
      return res.status(400).json(errorResponse);
    }

    // Extract query parameters
    const voice = (req.query.voice as string) || 'alloy';
    const speed = parseFloat(req.query.speed as string) || 1.0;

    // Validate voice parameter
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    if (!validVoices.includes(voice)) {
      const errorResponse = ErrorHandler.createErrorResponse(
        ERROR_CODES.INVALID_INPUT,
        'Invalid voice parameter. Valid options: alloy, echo, fable, onyx, nova, shimmer.',
        { voice, validVoices },
        requestId
      );
      return res.status(400).json(errorResponse);
    }

    // Validate speed parameter
    if (speed < 0.25 || speed > 4.0) {
      const errorResponse = ErrorHandler.createErrorResponse(
        ERROR_CODES.INVALID_INPUT,
        'Speed must be between 0.25 and 4.0.',
        { speed, minSpeed: 0.25, maxSpeed: 4.0 },
        requestId
      );
      return res.status(400).json(errorResponse);
    }

    logger.info('Starting text-to-speech synthesis', {
      requestId,
      service: 'tts',
      metadata: {
        textLength: text.length,
        voice,
        speed,
        textPreview: text.substring(0, 100)
      }
    });

    // Convert text to speech with fallback handling
    let audioBuffer: Buffer;
    try {
      audioBuffer = await voiceProcessingService.convertTextToSpeech(
        text,
        voice as any,
        speed
      );
      
      const processingTime = Date.now() - startTime;
      
      logger.logVoiceProcessing('tts', processingTime, true, requestId, undefined, undefined, {
        textLength: text.length,
        audioBufferSize: audioBuffer.length,
        voice,
        speed
      });

      fallbackService.recordServiceCall('openai-tts', true, processingTime);
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.logVoiceProcessing('tts', processingTime, false, requestId, undefined, error as Error);
      fallbackService.recordServiceCall('openai-tts', false, processingTime, error as Error);
      
      // For standalone TTS endpoint, we should return an error rather than fallback
      throw error;
    }

    const processingTime = Date.now() - startTime;

    // Set appropriate headers for audio response
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'X-Processing-Time': processingTime.toString(),
      'X-Request-ID': requestId
    });

    return res.status(200).send(audioBuffer);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('Text-to-speech synthesis failed', {
      requestId,
      service: 'tts',
      duration: processingTime,
      error: {
        message: (error as Error).message,
        stack: (error as Error).stack
      },
      metadata: {
        textLength: req.params.text?.length,
        voice: req.query.voice,
        speed: req.query.speed
      }
    });

    // Handle specific error types
    if (error && typeof error === 'object' && 'error' in error) {
      // Already formatted error response
      return res.status(400).json(error);
    }

    // Generic error handling
    const errorResponse = ErrorHandler.createErrorResponse(
      ERROR_CODES.AUDIO_PROCESSING_FAILED,
      'Failed to convert text to speech. Please try again.',
      { 
        processingTime,
        originalError: error instanceof Error ? error.message : 'Unknown error'
      },
      requestId
    );

    return res.status(500).json(errorResponse);
  }
});

/**
 * GET /api/voice/synthesize/ (empty text handling)
 * Handle empty text parameter for TTS endpoint
 */
router.get('/synthesize/', (req, res) => {
  const requestId = req.requestId || uuidv4();
  const errorResponse = ErrorHandler.createErrorResponse(
    ERROR_CODES.INVALID_INPUT,
    'Text parameter is required for speech synthesis.',
    undefined,
    requestId
  );
  return res.status(400).json(errorResponse);
});

/**
 * GET /api/voice/cache-stats
 * Get TTS cache statistics (for debugging/monitoring)
 */
router.get('/cache-stats', (req, res) => {
  try {
    const stats = voiceProcessingService.getCacheStats();
    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorResponse = ErrorHandler.createErrorResponse(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      'Failed to retrieve cache statistics.',
      { originalError: error instanceof Error ? error.message : 'Unknown error' },
      req.requestId
    );
    res.status(500).json(errorResponse);
  }
});

export default router;