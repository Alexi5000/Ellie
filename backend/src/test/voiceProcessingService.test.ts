/**
 * Unit tests for VoiceProcessingService
 * Requirements: 1.3, 5.1
 */

import { VoiceProcessingService } from '../services/voiceProcessingService';
import { ERROR_CODES } from '../types';

// Mock OpenAI
jest.mock('openai');

describe('VoiceProcessingService', () => {
  let service: VoiceProcessingService;
  let mockOpenAI: any;

  beforeEach(() => {
    // Set up environment variable
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    // Mock OpenAI constructor and methods
    const OpenAI = require('openai');
    mockOpenAI = {
      audio: {
        transcriptions: {
          create: jest.fn()
        }
      }
    };
    OpenAI.mockImplementation(() => mockOpenAI);
    
    service = new VoiceProcessingService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error if OPENAI_API_KEY is not set', () => {
      delete process.env.OPENAI_API_KEY;
      expect(() => new VoiceProcessingService()).toThrow('OPENAI_API_KEY environment variable is required');
    });

    it('should initialize OpenAI client with API key', () => {
      const OpenAI = require('openai');
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key'
      });
    });
  });

  describe('validateAudioFormat', () => {
    it('should return false for null/undefined file', () => {
      expect(service.validateAudioFormat(null as any)).toBe(false);
      expect(service.validateAudioFormat(undefined as any)).toBe(false);
    });

    it('should return false for files exceeding size limit', () => {
      const largeFile = {
        size: 26 * 1024 * 1024, // 26MB
        mimetype: 'audio/mpeg',
        originalname: 'test.mp3'
      } as Express.Multer.File;

      expect(service.validateAudioFormat(largeFile)).toBe(false);
    });

    it('should return false for unsupported MIME types', () => {
      const invalidFile = {
        size: 1024,
        mimetype: 'text/plain',
        originalname: 'test.txt'
      } as Express.Multer.File;

      expect(service.validateAudioFormat(invalidFile)).toBe(false);
    });

    it('should return true for valid audio files', () => {
      const validFiles = [
        { size: 1024, mimetype: 'audio/mpeg', originalname: 'test.mp3' },
        { size: 1024, mimetype: 'audio/wav', originalname: 'test.wav' },
        { size: 1024, mimetype: 'audio/m4a', originalname: 'test.m4a' },
        { size: 1024, mimetype: 'audio/webm', originalname: 'test.webm' },
        { size: 1024, mimetype: 'video/mp4', originalname: 'test.mp4' }
      ];

      validFiles.forEach(file => {
        expect(service.validateAudioFormat(file as Express.Multer.File)).toBe(true);
      });
    });

    it('should return false for unsupported file extensions', () => {
      const invalidExtensionFile = {
        size: 1024,
        mimetype: 'audio/mpeg',
        originalname: 'test.xyz'
      } as Express.Multer.File;

      expect(service.validateAudioFormat(invalidExtensionFile)).toBe(false);
    });
  });

  describe('processAudioInput', () => {
    const mockAudioBuffer = Buffer.from('mock audio data');

    it('should successfully transcribe audio', async () => {
      const expectedTranscription = 'Hello, this is a test transcription.';
      mockOpenAI.audio.transcriptions.create.mockResolvedValue(expectedTranscription);

      const result = await service.processAudioInput(mockAudioBuffer, 'test.mp3');

      expect(result).toBe(expectedTranscription);
      expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledWith({
        file: expect.any(File),
        model: 'whisper-1',
        language: 'en',
        response_format: 'text'
      });
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('rate limit exceeded');
      mockOpenAI.audio.transcriptions.create.mockRejectedValue(rateLimitError);

      await expect(service.processAudioInput(mockAudioBuffer))
        .rejects
        .toMatchObject({
          error: {
            code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
            message: 'Speech-to-text service rate limit exceeded. Please try again later.'
          }
        });
    });

    it('should handle invalid file format errors', async () => {
      const formatError = new Error('invalid file format');
      mockOpenAI.audio.transcriptions.create.mockRejectedValue(formatError);

      await expect(service.processAudioInput(mockAudioBuffer))
        .rejects
        .toMatchObject({
          error: {
            code: ERROR_CODES.INVALID_AUDIO_FORMAT,
            message: 'Invalid audio format. Please use MP3, WAV, or M4A format.'
          }
        });
    });

    it('should handle file too large errors', async () => {
      const sizeError = new Error('file too large');
      mockOpenAI.audio.transcriptions.create.mockRejectedValue(sizeError);

      await expect(service.processAudioInput(mockAudioBuffer))
        .rejects
        .toMatchObject({
          error: {
            code: ERROR_CODES.AUDIO_TOO_LARGE,
            message: 'Audio file is too large. Maximum size is 25MB.'
          }
        });
    });

    it('should handle generic processing errors', async () => {
      const genericError = new Error('Something went wrong');
      mockOpenAI.audio.transcriptions.create.mockRejectedValue(genericError);

      await expect(service.processAudioInput(mockAudioBuffer))
        .rejects
        .toMatchObject({
          error: {
            code: ERROR_CODES.AUDIO_PROCESSING_FAILED,
            message: 'Failed to process audio input. Please try again.'
          }
        });
    });

    it('should trim whitespace from transcription', async () => {
      const transcriptionWithWhitespace = '  Hello world  \n';
      mockOpenAI.audio.transcriptions.create.mockResolvedValue(transcriptionWithWhitespace);

      const result = await service.processAudioInput(mockAudioBuffer);

      expect(result).toBe('Hello world');
    });
  });

  describe('createAudioInput', () => {
    it('should create AudioInput object from Multer file', () => {
      const mockFile = {
        buffer: Buffer.from('test audio'),
        mimetype: 'audio/mpeg',
        originalname: 'test.mp3',
        size: 1024
      } as Express.Multer.File;

      const audioInput = service.createAudioInput(mockFile);

      expect(audioInput).toEqual({
        buffer: mockFile.buffer,
        format: mockFile.mimetype,
        duration: 0,
        sampleRate: 0
      });
    });
  });

  describe('convertTextToSpeech', () => {
    const mockAudioBuffer = Buffer.from('mock audio data');

    beforeEach(() => {
      mockOpenAI.audio = {
        ...mockOpenAI.audio,
        speech: {
          create: jest.fn()
        }
      };
    });

    it('should successfully convert text to speech', async () => {
      const mockResponse = {
        arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer)
      };
      mockOpenAI.audio.speech.create.mockResolvedValue(mockResponse);

      const result = await service.convertTextToSpeech('Hello world');

      expect(result).toEqual(mockAudioBuffer);
      expect(mockOpenAI.audio.speech.create).toHaveBeenCalledWith({
        model: 'tts-1',
        voice: 'alloy',
        input: 'Hello world',
        response_format: 'mp3',
        speed: 1.0
      });
    });

    it('should handle custom voice and speed parameters', async () => {
      const mockResponse = {
        arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer)
      };
      mockOpenAI.audio.speech.create.mockResolvedValue(mockResponse);

      await service.convertTextToSpeech('Hello world', 'nova', 1.5);

      expect(mockOpenAI.audio.speech.create).toHaveBeenCalledWith({
        model: 'tts-1',
        voice: 'nova',
        input: 'Hello world',
        response_format: 'mp3',
        speed: 1.5
      });
    });

    it('should reject empty text input', async () => {
      await expect(service.convertTextToSpeech(''))
        .rejects
        .toMatchObject({
          error: {
            code: ERROR_CODES.INVALID_INPUT,
            message: 'Text input is required for speech synthesis.'
          }
        });
    });

    it('should reject text that is too long', async () => {
      const longText = 'a'.repeat(4097);
      
      await expect(service.convertTextToSpeech(longText))
        .rejects
        .toMatchObject({
          error: {
            code: ERROR_CODES.INVALID_INPUT,
            message: 'Text is too long. Maximum length is 4096 characters.'
          }
        });
    });

    it('should reject invalid speed values', async () => {
      await expect(service.convertTextToSpeech('Hello', 'alloy', 0.1))
        .rejects
        .toMatchObject({
          error: {
            code: ERROR_CODES.INVALID_INPUT,
            message: 'Speed must be between 0.25 and 4.0.'
          }
        });

      await expect(service.convertTextToSpeech('Hello', 'alloy', 5.0))
        .rejects
        .toMatchObject({
          error: {
            code: ERROR_CODES.INVALID_INPUT,
            message: 'Speed must be between 0.25 and 4.0.'
          }
        });
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('rate limit exceeded');
      mockOpenAI.audio.speech.create.mockRejectedValue(rateLimitError);

      await expect(service.convertTextToSpeech('Hello world'))
        .rejects
        .toMatchObject({
          error: {
            code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
            message: 'Text-to-speech service rate limit exceeded. Please try again later.'
          }
        });
    });

    it('should handle invalid voice errors', async () => {
      const voiceError = new Error('invalid voice');
      mockOpenAI.audio.speech.create.mockRejectedValue(voiceError);

      await expect(service.convertTextToSpeech('Hello world'))
        .rejects
        .toMatchObject({
          error: {
            code: ERROR_CODES.INVALID_INPUT,
            message: 'Invalid voice selection. Please use alloy, echo, fable, onyx, nova, or shimmer.'
          }
        });
    });

    it('should handle content policy violations', async () => {
      const policyError = new Error('content policy violation');
      mockOpenAI.audio.speech.create.mockRejectedValue(policyError);

      await expect(service.convertTextToSpeech('Hello world'))
        .rejects
        .toMatchObject({
          error: {
            code: ERROR_CODES.INAPPROPRIATE_CONTENT,
            message: 'Text content violates content policy. Please modify your message.'
          }
        });
    });

    it('should handle generic TTS errors', async () => {
      const genericError = new Error('Something went wrong');
      mockOpenAI.audio.speech.create.mockRejectedValue(genericError);

      await expect(service.convertTextToSpeech('Hello world'))
        .rejects
        .toMatchObject({
          error: {
            code: ERROR_CODES.AUDIO_PROCESSING_FAILED,
            message: 'Failed to convert text to speech. Please try again.'
          }
        });
    });

    it('should use cache for repeated requests', async () => {
      const mockResponse = {
        arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer)
      };
      mockOpenAI.audio.speech.create.mockResolvedValue(mockResponse);

      // First call
      const result1 = await service.convertTextToSpeech('Hello world');
      expect(mockOpenAI.audio.speech.create).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await service.convertTextToSpeech('Hello world');
      expect(mockOpenAI.audio.speech.create).toHaveBeenCalledTimes(1); // Still 1
      expect(result1).toEqual(result2);
    });
  });

  describe('cache management', () => {
    beforeEach(() => {
      mockOpenAI.audio = {
        ...mockOpenAI.audio,
        speech: {
          create: jest.fn()
        }
      };
    });

    it('should clear TTS cache', () => {
      service.clearTTSCache();
      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should provide cache statistics', async () => {
      const mockResponse = {
        arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('test'))
      };
      mockOpenAI.audio.speech.create.mockResolvedValue(mockResponse);

      await service.convertTextToSpeech('Test message');
      
      const stats = service.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.keys).toHaveLength(1);
      expect(stats.keys[0]).toContain('Test message');
    });
  });

  describe('getContentType (private method behavior)', () => {
    it('should handle different file extensions correctly', async () => {
      // Test through processAudioInput to verify content type handling
      mockOpenAI.audio.transcriptions.create.mockResolvedValue('test');

      const testCases = [
        { filename: 'test.mp3', expectedCall: true },
        { filename: 'test.wav', expectedCall: true },
        { filename: 'test.m4a', expectedCall: true },
        { filename: undefined, expectedCall: true }
      ];

      for (const testCase of testCases) {
        await service.processAudioInput(Buffer.from('test'), testCase.filename);
        expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalled();
      }
    });
  });
});