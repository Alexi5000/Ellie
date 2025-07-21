/**
 * Tests for LoggerService
 * Requirements: 5.4, 5.5
 */

import { LoggerService, LogLevel } from '../services/loggerService';

describe('LoggerService', () => {
  let logger: LoggerService;

  beforeEach(() => {
    logger = LoggerService.getInstance();
    logger.clearLogs();
  });

  afterEach(() => {
    logger.clearLogs();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = LoggerService.getInstance();
      const instance2 = LoggerService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Basic Logging', () => {
    it('should log error messages', () => {
      const message = 'Test error message';
      const requestId = 'test-request-id';

      logger.error(message, { requestId });

      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].message).toBe(message);
      expect(logs[0].requestId).toBe(requestId);
    });

    it('should log warning messages', () => {
      const message = 'Test warning message';
      logger.warn(message);

      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[0].message).toBe(message);
    });

    it('should log info messages', () => {
      const message = 'Test info message';
      logger.info(message);

      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe(message);
    });

    it('should log debug messages in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const message = 'Test debug message';
      logger.debug(message);

      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.DEBUG);

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log debug messages in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const message = 'Test debug message';
      logger.debug(message);

      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(0);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Structured Logging', () => {
    it('should log with error details', () => {
      const message = 'Test error with details';
      const error = new Error('Test error');
      const requestId = 'test-request';

      logger.error(message, {
        requestId,
        error: {
          message: error.message,
          stack: error.stack
        }
      });

      const logs = logger.getRecentLogs(1);
      expect(logs[0].error?.message).toBe(error.message);
      expect(logs[0].error?.stack).toBe(error.stack);
    });

    it('should log with metadata', () => {
      const message = 'Test with metadata';
      const metadata = { userId: '123', action: 'test' };

      logger.info(message, { metadata });

      const logs = logger.getRecentLogs(1);
      expect(logs[0].metadata).toEqual(metadata);
    });

    it('should log with service information', () => {
      const message = 'Service test';
      const service = 'test-service';

      logger.info(message, { service });

      const logs = logger.getRecentLogs(1);
      expect(logs[0].service).toBe(service);
    });
  });

  describe('Specialized Logging Methods', () => {
    it('should log API requests', () => {
      const method = 'POST';
      const url = '/api/test';
      const statusCode = 200;
      const duration = 150;
      const requestId = 'req-123';

      logger.logRequest(method, url, statusCode, duration, requestId);

      const logs = logger.getRecentLogs(1);
      expect(logs[0].method).toBe(method);
      expect(logs[0].url).toBe(url);
      expect(logs[0].statusCode).toBe(statusCode);
      expect(logs[0].duration).toBe(duration);
      expect(logs[0].requestId).toBe(requestId);
      expect(logs[0].service).toBe('api');
    });

    it('should log WebSocket events', () => {
      const event = 'connection';
      const socketId = 'socket-123';
      const sessionId = 'session-456';

      logger.logWebSocketEvent(event, socketId, sessionId);

      const logs = logger.getRecentLogs(1);
      expect(logs[0].sessionId).toBe(sessionId);
      expect(logs[0].service).toBe('websocket');
      expect(logs[0].metadata?.socketId).toBe(socketId);
      expect(logs[0].metadata?.event).toBe(event);
    });

    it('should log WebSocket errors', () => {
      const event = 'error';
      const socketId = 'socket-123';
      const error = new Error('WebSocket error');

      logger.logWebSocketEvent(event, socketId, undefined, error);

      const logs = logger.getRecentLogs(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].error?.message).toBe(error.message);
    });

    it('should log external API calls', () => {
      const service = 'openai';
      const endpoint = '/v1/chat/completions';
      const duration = 500;
      const success = true;
      const requestId = 'req-123';

      logger.logExternalApiCall(service, endpoint, duration, success, requestId);

      const logs = logger.getRecentLogs(1);
      expect(logs[0].service).toBe(`external-${service}`);
      expect(logs[0].duration).toBe(duration);
      expect(logs[0].metadata?.endpoint).toBe(endpoint);
      expect(logs[0].metadata?.success).toBe(success);
    });

    it('should log voice processing events', () => {
      const stage = 'transcription';
      const duration = 200;
      const success = true;
      const requestId = 'req-123';
      const sessionId = 'session-456';

      logger.logVoiceProcessing(stage, duration, success, requestId, sessionId);

      const logs = logger.getRecentLogs(1);
      expect(logs[0].service).toBe('voice-processing');
      expect(logs[0].duration).toBe(duration);
      expect(logs[0].metadata?.stage).toBe(stage);
      expect(logs[0].metadata?.success).toBe(success);
    });

    it('should log rate limiting events', () => {
      const ip = '192.168.1.1';
      const endpoint = '/api/voice/process';
      const requestId = 'req-123';
      const currentCount = 8;
      const limit = 10;

      logger.logRateLimit(ip, endpoint, requestId, currentCount, limit);

      const logs = logger.getRecentLogs(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[0].service).toBe('rate-limiter');
      expect(logs[0].metadata?.ip).toBe(ip);
      expect(logs[0].metadata?.currentCount).toBe(currentCount);
      expect(logs[0].metadata?.limit).toBe(limit);
    });
  });

  describe('Log Retrieval', () => {
    beforeEach(() => {
      // Add some test logs
      logger.error('Error 1');
      logger.warn('Warning 1');
      logger.info('Info 1');
      logger.error('Error 2');
      logger.info('Info 2');
    });

    it('should get recent logs', () => {
      const logs = logger.getRecentLogs(3);
      expect(logs).toHaveLength(3);
      // Should be in reverse chronological order (most recent first)
      expect(logs[0].message).toBe('Info 2');
      expect(logs[1].message).toBe('Error 2');
      expect(logs[2].message).toBe('Info 1');
    });

    it('should filter logs by level', () => {
      const errorLogs = logger.getRecentLogs(10, LogLevel.ERROR);
      expect(errorLogs).toHaveLength(2);
      expect(errorLogs[0].message).toBe('Error 2');
      expect(errorLogs[1].message).toBe('Error 1');
    });

    it('should get logs for specific request', () => {
      const requestId = 'specific-request';
      logger.info('Request specific log', { requestId });

      const requestLogs = logger.getRequestLogs(requestId);
      expect(requestLogs).toHaveLength(1);
      expect(requestLogs[0].requestId).toBe(requestId);
    });
  });

  describe('Error Statistics', () => {
    beforeEach(() => {
      // Add some test error logs
      logger.error('Error 1', { 
        error: { code: 'CODE_A', message: 'Error A' },
        service: 'service-1'
      });
      logger.error('Error 2', { 
        error: { code: 'CODE_B', message: 'Error B' },
        service: 'service-1'
      });
      logger.error('Error 3', { 
        error: { code: 'CODE_A', message: 'Error A again' },
        service: 'service-2'
      });
    });

    it('should get error statistics', () => {
      const stats = logger.getErrorStats();
      
      expect(stats.total).toBe(3);
      expect(stats.byCode['CODE_A']).toBe(2);
      expect(stats.byCode['CODE_B']).toBe(1);
      expect(stats.byService['service-1']).toBe(2);
      expect(stats.byService['service-2']).toBe(1);
    });

    it('should filter error statistics by time window', () => {
      // Add an old error (simulate by manipulating timestamp)
      const oldLog = {
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
        level: LogLevel.ERROR,
        message: 'Old error',
        error: { code: 'OLD_CODE', message: 'Old error' },
        service: 'old-service'
      };

      // Manually add to buffer (normally would use private method)
      (logger as any).logBuffer.push(oldLog);

      const stats = logger.getErrorStats(3600000); // 1 hour window
      
      // Should not include the old error
      expect(stats.total).toBe(3);
      expect(stats.byCode['OLD_CODE']).toBeUndefined();
    });
  });

  describe('Buffer Management', () => {
    it('should maintain buffer size limit', () => {
      const maxBufferSize = (logger as any).maxBufferSize;
      
      // Add more logs than buffer size
      for (let i = 0; i < maxBufferSize + 10; i++) {
        logger.info(`Log ${i}`);
      }

      const logs = logger.getRecentLogs(maxBufferSize + 20);
      expect(logs.length).toBeLessThanOrEqual(maxBufferSize);
    });

    it('should clear logs', () => {
      logger.info('Test log');
      expect(logger.getRecentLogs(1)).toHaveLength(1);

      logger.clearLogs();
      expect(logger.getRecentLogs(1)).toHaveLength(0);
    });
  });
});