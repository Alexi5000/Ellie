/**
 * Voice Processing Service - OpenAI Whisper speech-to-text integration
 * Requirements: 1.3, 5.1
 */

import OpenAI from 'openai';
import { AudioInput, AudioResponse, ErrorResponse, ERROR_CODES } from '../types';
import { createErrorResponse } from '../utils/errorHandler';
import { cacheService } from './cacheService';
import { languageDetectionService } from './languageDetectionService';

export class VoiceProcessingService {
  private openai: OpenAI;
  private readonly SUPPORTED_FORMATS = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'];
  private readonly MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit for OpenAI Whisper
  private readonly ttsCache = new Map<string, { buffer: Buffer; timestamp: number }>();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache duration

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Validates audio file format and size
   * @param file - Multer file object
   * @returns boolean indicating if file is valid
   */
  public validateAudioFormat(file: Express.Multer.File): boolean {
    if (!file) {
      return false;
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return false;
    }

    // Check MIME type
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

    // Check file extension if available
    if (file.originalname) {
      const extension = file.originalname.split('.').pop()?.toLowerCase();
      if (extension && !this.SUPPORTED_FORMATS.includes(extension)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Processes audio input using OpenAI Whisper API
   * @param audioBuffer - Audio data buffer
   * @param filename - Original filename for format detection
   * @param language - ISO language code (optional, auto-detects if not provided)
   * @returns Promise<string> - Transcribed text
   */
  public async processAudioInput(
    audioBuffer: Buffer, 
    filename?: string,
    language?: string
  ): Promise<string> {
    const startTime = Date.now();

    try {
      // Create a temporary file-like object for OpenAI API
      const audioFile = new File([audioBuffer], filename || 'audio.wav', {
        type: this.getContentType(filename)
      });

      // Call OpenAI Whisper API
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: language, // Use provided language or auto-detect (undefined for auto-detect)
        response_format: 'text'
      });

      const processingTime = Date.now() - startTime;
      console.log(`Audio transcription completed in ${processingTime}ms${language ? ` (language: ${language})` : ' (auto-detected language)'}`);

      return transcription.trim();

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('Audio processing failed:', error);

      if (error instanceof Error) {
        // Handle specific OpenAI API errors
        if (error.message.includes('rate limit')) {
          throw createErrorResponse(
            ERROR_CODES.RATE_LIMIT_EXCEEDED,
            'Speech-to-text service rate limit exceeded. Please try again later.',
            { processingTime, originalError: error.message }
          );
        }

        if (error.message.includes('invalid file format')) {
          throw createErrorResponse(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            'Invalid audio format. Please use MP3, WAV, or M4A format.',
            { processingTime, originalError: error.message }
          );
        }

        if (error.message.includes('file too large')) {
          throw createErrorResponse(
            ERROR_CODES.AUDIO_TOO_LARGE,
            'Audio file is too large. Maximum size is 25MB.',
            { processingTime, originalError: error.message }
          );
        }
      }

      // Generic audio processing error
      throw createErrorResponse(
        ERROR_CODES.AUDIO_PROCESSING_FAILED,
        'Failed to process audio input. Please try again.',
        { processingTime, originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Determines content type based on filename
   * @param filename - Original filename
   * @returns Content type string
   */
  private getContentType(filename?: string): string {
    if (!filename) return 'audio/wav';

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

  /**
   * Converts text to speech using OpenAI TTS API
   * Requirements: 1.4, 5.3
   * @param text - Text to convert to speech
   * @param voice - Voice to use (alloy, echo, fable, onyx, nova, shimmer)
   * @param speed - Speech speed (0.25 to 4.0)
   * @param language - Language code for voice selection (optional)
   * @returns Promise<Buffer> - Audio buffer
   */
  public async convertTextToSpeech(
    text: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy',
    speed: number = 1.0,
    language?: string
  ): Promise<Buffer> {
    const startTime = Date.now();

    // Validate input
    if (!text || text.trim().length === 0) {
      throw createErrorResponse(
        ERROR_CODES.INVALID_INPUT,
        'Text input is required for speech synthesis.',
        { text }
      );
    }

    if (text.length > 4096) {
      throw createErrorResponse(
        ERROR_CODES.INVALID_INPUT,
        'Text is too long. Maximum length is 4096 characters.',
        { textLength: text.length }
      );
    }

    if (speed < 0.25 || speed > 4.0) {
      throw createErrorResponse(
        ERROR_CODES.INVALID_INPUT,
        'Speed must be between 0.25 and 4.0.',
        { speed }
      );
    }

    // Check Redis cache first
    const cachedAudio = await cacheService.getCachedTTSAudio(text, voice, speed, language);
    if (cachedAudio) {
      console.log(`TTS Redis cache hit for text: ${text.substring(0, 50)}...`);
      return cachedAudio;
    }

    // Check local cache as fallback
    const cacheKey = `${text}-${voice}-${speed}-${language || 'default'}`;
    const localCached = this.getCachedAudio(cacheKey);
    if (localCached) {
      console.log(`TTS local cache hit for key: ${cacheKey.substring(0, 50)}...`);
      // Also cache in Redis for future requests
      await cacheService.cacheTTSAudio(text, voice, speed, localCached, { language });
      return localCached;
    }

    try {
      // Call OpenAI TTS API
      const mp3Response = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: text,
        response_format: 'mp3',
        speed: speed
      });

      // Convert response to buffer
      const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());
      
      const processingTime = Date.now() - startTime;
      console.log(`Text-to-speech completed in ${processingTime}ms`);

      // Cache the result in both local and Redis cache
      this.setCachedAudio(cacheKey, audioBuffer);
      await cacheService.cacheTTSAudio(text, voice, speed, audioBuffer, {
        ttl: 7200, // 2 hours for TTS audio
        language: language // Store language for cache key
      });

      return audioBuffer;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('Text-to-speech failed:', error);

      if (error instanceof Error) {
        // Handle specific OpenAI API errors
        if (error.message.includes('rate limit')) {
          throw createErrorResponse(
            ERROR_CODES.RATE_LIMIT_EXCEEDED,
            'Text-to-speech service rate limit exceeded. Please try again later.',
            { processingTime, originalError: error.message }
          );
        }

        if (error.message.includes('invalid voice')) {
          throw createErrorResponse(
            ERROR_CODES.INVALID_INPUT,
            'Invalid voice selection. Please use alloy, echo, fable, onyx, nova, or shimmer.',
            { processingTime, voice, originalError: error.message }
          );
        }

        if (error.message.includes('content policy')) {
          throw createErrorResponse(
            ERROR_CODES.INAPPROPRIATE_CONTENT,
            'Text content violates content policy. Please modify your message.',
            { processingTime, originalError: error.message }
          );
        }
      }

      // Generic TTS error
      throw createErrorResponse(
        ERROR_CODES.AUDIO_PROCESSING_FAILED,
        'Failed to convert text to speech. Please try again.',
        { processingTime, originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Gets cached audio if available and not expired
   * @param cacheKey - Cache key
   * @returns Buffer if cached, null otherwise
   */
  private getCachedAudio(cacheKey: string): Buffer | null {
    const cached = this.ttsCache.get(cacheKey);
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.ttsCache.delete(cacheKey);
      return null;
    }

    return cached.buffer;
  }

  /**
   * Caches audio buffer with timestamp
   * @param cacheKey - Cache key
   * @param buffer - Audio buffer to cache
   */
  private setCachedAudio(cacheKey: string, buffer: Buffer): void {
    // Clean up expired entries periodically
    if (this.ttsCache.size > 100) {
      this.cleanupExpiredCache();
    }

    this.ttsCache.set(cacheKey, {
      buffer,
      timestamp: Date.now()
    });
  }

  /**
   * Removes expired entries from cache
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.ttsCache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.ttsCache.delete(key);
      }
    }
  }

  /**
   * Clears the entire TTS cache
   */
  public clearTTSCache(): void {
    this.ttsCache.clear();
  }

  /**
   * Gets cache statistics
   * @returns Object with cache size and hit rate info
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.ttsCache.size,
      keys: Array.from(this.ttsCache.keys()).map(key => key.substring(0, 50) + '...')
    };
  }

  /**
   * Creates AudioInput object from Multer file
   * @param file - Multer file object
   * @returns AudioInput object
   */
  public createAudioInput(file: Express.Multer.File): AudioInput {
    return {
      buffer: file.buffer,
      format: file.mimetype,
      duration: 0, // Duration detection would require additional audio processing
      sampleRate: 0 // Sample rate detection would require additional audio processing
    };
  }
}