/**
 * Test to verify LoggerService export patterns
 * This test ensures that both the class and singleton instance are properly exported
 */

import { LoggerService, logger, LogLevel } from '../services/loggerService';

describe('LoggerService Export Patterns', () => {
  describe('Class Export', () => {
    it('should be able to import LoggerService class', () => {
      expect(LoggerService).toBeDefined();
      expect(typeof LoggerService).toBe('function');
    });

    it('should be able to access getInstance static method', () => {
      expect(LoggerService.getInstance).toBeDefined();
      expect(typeof LoggerService.getInstance).toBe('function');
    });

    it('should return singleton instance from getInstance', () => {
      const instance1 = LoggerService.getInstance();
      const instance2 = LoggerService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should have all public methods accessible', () => {
      const instance = LoggerService.getInstance();
      expect(instance.error).toBeDefined();
      expect(instance.warn).toBeDefined();
      expect(instance.info).toBeDefined();
      expect(instance.debug).toBeDefined();
      expect(instance.logRequest).toBeDefined();
      expect(instance.logWebSocketEvent).toBeDefined();
      expect(instance.logExternalApiCall).toBeDefined();
      expect(instance.logVoiceProcessing).toBeDefined();
      expect(instance.logRateLimit).toBeDefined();
      expect(instance.getRecentLogs).toBeDefined();
      expect(instance.getRequestLogs).toBeDefined();
      expect(instance.getErrorStats).toBeDefined();
      expect(instance.clearLogs).toBeDefined();
    });
  });

  describe('Singleton Instance Export', () => {
    it('should be able to import logger singleton instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger).toBe('object');
    });

    it('should have all public methods accessible on singleton', () => {
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.logRequest).toBeDefined();
      expect(logger.logWebSocketEvent).toBeDefined();
      expect(logger.logExternalApiCall).toBeDefined();
      expect(logger.logVoiceProcessing).toBeDefined();
      expect(logger.logRateLimit).toBeDefined();
      expect(logger.getRecentLogs).toBeDefined();
      expect(logger.getRequestLogs).toBeDefined();
      expect(logger.getErrorStats).toBeDefined();
      expect(logger.clearLogs).toBeDefined();
    });

    it('should be the same instance as getInstance returns', () => {
      const instance = LoggerService.getInstance();
      expect(logger).toBe(instance);
    });
  });

  describe('Enum Export', () => {
    it('should be able to import LogLevel enum', () => {
      expect(LogLevel).toBeDefined();
      expect(LogLevel.ERROR).toBe('error');
      expect(LogLevel.WARN).toBe('warn');
      expect(LogLevel.INFO).toBe('info');
      expect(LogLevel.DEBUG).toBe('debug');
    });
  });

  describe('Functional Tests', () => {
    beforeEach(() => {
      logger.clearLogs();
    });

    afterEach(() => {
      logger.clearLogs();
    });

    it('should work correctly when using class getInstance', () => {
      const instance = LoggerService.getInstance();
      instance.info('Test message from getInstance');
      
      const logs = instance.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test message from getInstance');
    });

    it('should work correctly when using singleton instance', () => {
      logger.info('Test message from singleton');
      
      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test message from singleton');
    });

    it('should share state between getInstance and singleton', () => {
      const instance = LoggerService.getInstance();
      instance.info('Message from getInstance');
      
      const logsFromSingleton = logger.getRecentLogs(1);
      expect(logsFromSingleton).toHaveLength(1);
      expect(logsFromSingleton[0].message).toBe('Message from getInstance');
    });
  });
});
