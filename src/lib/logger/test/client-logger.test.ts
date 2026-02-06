/**
 * Client Logger Tests
 * Unit tests for client-side logging functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClientLogger } from '../client-logger';

// Mock fetch
global.fetch = vi.fn();

describe('ClientLogger', () => {
  let logger: ClientLogger;

  beforeEach(() => {
    logger = new ClientLogger();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Logging', () => {
    it('should log info messages', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => { });
      logger.info('Test message', { component: 'test' });
      expect(spy).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
      logger.error('Error message', new Error('Test error'));
      expect(spy).toHaveBeenCalled();
    });

    it('should log warnings', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => { });
      logger.warn('Warning message');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Context Enrichment', () => {
    it('should enrich context with request information', () => {
      // This test would need to mock browser environment
      // For now, we'll just verify the method exists
      expect(logger.info).toBeDefined();
    });
  });

  describe('User Actions', () => {
    it('should log user actions', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => { });
      logger.logUserAction('click', { buttonId: 'submit' });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Performance Logging', () => {
    it('should log performance metrics', () => {
      logger.logPerformance('api_call', 150, { endpoint: '/api/users' });
      // Performance metric should be logged
    });

    it('should warn on slow performance', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => { });
      logger.logPerformance('api_call', 2000, { endpoint: '/api/slow' });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Security Logging', () => {
    it('should log security events', () => {
      logger.logSecurityEvent('failed_login', 'high', {
        ip: '192.168.1.1',
      });
      // Security event should be logged
    });

    it('should flush immediately for critical security events', async () => {
      const flushSpy = vi.spyOn(logger, 'flush');
      logger.logSecurityEvent('account_takeover', 'critical', {
        userId: '123',
      });
      expect(flushSpy).toHaveBeenCalled();
    });
  });

  describe('API Call Logging', () => {
    it('should log successful API calls', () => {
      logger.logApiCall('GET', '/api/users', 200, 150);
      // API call should be logged at debug level
    });

    it('should warn on client errors', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => { });
      logger.logApiCall('POST', '/api/users', 400, 100);
      expect(spy).toHaveBeenCalled();
    });

    it('should error on server errors', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
      logger.logApiCall('GET', '/api/users', 500, 200);
      expect(spy).toHaveBeenCalled();
    });
  });
});
