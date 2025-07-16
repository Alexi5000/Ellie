/**
 * Voice Processing API Routes
 * Requirements: 1.3, 5.1, 5.2, 1.4, 5.3
 */

import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { VoiceProcessingService } from '../services/voiceProcessingService';
import { AIResponseService } from '../services/aiResponseService';
import { ErrorHandler } from '../utils/errorHandler';
import { ERROR_CODES, ConversationContext, Message, UserPreferences } from '../types';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Initialize services
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

// Rate limiting for voice processing endpoint
const voiceProcessingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 voice processing requests per minute
  message: ErrorHandler.createErrorResponse(
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    'Too many voice processing requests. Please wait before trying again.',
    { limit: 10, windowMs: 60000 }
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for text-to-speech endpoint
const ttsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 TTS requests per minute
  message: ErrorHandler.createErrorResponse(
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    'Too many text-to-speech requests. Please wait before trying again.',
    { limit: 20, windowMs: 60000 }
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

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

    console.log(`[${new Date().toISOString()}] ${requestId} - Processing voice input for session: ${sessionId}`);

    // Step 1: Convert speech to text
    const transcribedText = await voiceProcessingService.processAudioInput(
      req.file.buffer,
      req.file.originalname
    );

    console.log(`[${new Date().toISOString()}] ${requestId} - Transcription completed: "${transcribedText.substring(0, 100)}..."`);

    // Step 2: Generate AI response
    const aiResponse = await aiResponseService.generateResponse(transcribedText, context);

    console.log(`[${new Date().toISOString()}] ${requestId} - AI response generated: "${aiResponse.substring(0, 100)}..."`);

    // Step 3: Convert AI response to speech
    const audioBuffer = await voiceProcessingService.convertTextToSpeech(
      aiResponse,
      'alloy', // Default voice, can be made configurable
      userPreferences.voiceSpeed
    );

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

    console.log(`[${new Date().toISOString()}] ${requestId} - Voice processing completed in ${totalProcessingTime}ms`);

    return res.status(200).json(response);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] ${requestId} - Voice processing failed:`, error);

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
router.get('/synthesize/:text', ttsLimiter, async (req, res) => {
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

    console.log(`[${new Date().toISOString()}] ${requestId} - Synthesizing text: "${text.substring(0, 100)}..."`);

    // Convert text to speech
    const audioBuffer = await voiceProcessingService.convertTextToSpeech(
      text,
      voice as any,
      speed
    );

    const processingTime = Date.now() - startTime;

    console.log(`[${new Date().toISOString()}] ${requestId} - Text-to-speech completed in ${processingTime}ms`);

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
    console.error(`[${new Date().toISOString()}] ${requestId} - Text-to-speech failed:`, error);

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