/**
 * Logger Utilities Tests
 * Unit tests for logging utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  maskPII,
  maskPIIString,
  sanitizeHeaders,
  formatError,
  generateCorrelationId,
  safeStringify,
  truncate,
  getObjectSize,
} from '../utils';

describe('Logger Utils', () => {
  describe('maskPIIString', () => {
    it('should mask email addresses', () => {
      const input = 'Contact user@example.com for info';
      const result = maskPIIString(input);
      expect(result).not.toContain('user@example.com');
      expect(result).toMatch(/u\*\*\*@\*\*\*\.com/);
    });

    it('should mask phone numbers', () => {
      const input = 'Call 555-123-4567 today';
      const result = maskPIIString(input);
      expect(result).not.toContain('555-123-4567');
      expect(result).toContain('4567'); // Last 4 digits kept
    });

    it('should mask credit card numbers', () => {
      const input = 'Card: 1234-5678-9012-3456';
      const result = maskPIIString(input);
      expect(result).not.toContain('1234-5678-9012');
      expect(result).toContain('3456'); // Last 4 digits kept
    });

    it('should mask IP addresses', () => {
      const input = 'From IP 192.168.1.1';
      const result = maskPIIString(input);
      expect(result).not.toContain('192.168.1');
      expect(result).toMatch(/\*\*\*\.\*\*\*\.\*\*\*\.\d+/);
    });
  });

  describe('maskPII', () => {
    it('should mask PII in objects', () => {
      const input = {
        email: 'user@example.com',
        phone: '555-123-4567',
        name: 'John Doe',
      };
      const result = maskPII(input);
      expect(result).toHaveProperty('email');
      expect((result as any).email).not.toContain('user@example.com');
      expect((result as any).name).toBe('John Doe'); // Name not masked
    });

    it('should mask sensitive field names', () => {
      const input = {
        password: 'secret123',
        apiKey: 'abc-def-ghi',
        username: 'john',
      };
      const result = maskPII(input);
      expect((result as any).password).toBe('[REDACTED]');
      expect((result as any).apiKey).toBe('[REDACTED]');
      expect((result as any).username).toBe('john'); // Not sensitive
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          email: 'user@example.com',
          profile: {
            phone: '555-123-4567',
          },
        },
      };
      const result = maskPII(input) as any;
      expect(result.user.email).not.toContain('user@example.com');
      expect(result.user.profile.phone).not.toContain('555-123');
    });

    it('should handle arrays', () => {
      const input = ['user@example.com', 'other@example.com'];
      const result = maskPII(input) as string[];
      expect(result[0]).not.toContain('user@example.com');
      expect(result[1]).not.toContain('other@example.com');
    });
  });

  describe('sanitizeHeaders', () => {
    it('should redact sensitive headers', () => {
      const headers = {
        'authorization': 'Bearer token123',
        'cookie': 'session=abc',
        'content-type': 'application/json',
      };
      const result = sanitizeHeaders(headers);
      expect(result.authorization).toBe('[REDACTED]');
      expect(result.cookie).toBe('[REDACTED]');
      expect(result['content-type']).toBe('application/json');
    });

    it('should handle Headers object', () => {
      const headers = new Headers({
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json',
      });
      const result = sanitizeHeaders(headers);
      expect(result.Authorization).toBe('[REDACTED]');
      expect(result['Content-Type']).toBe('application/json');
    });
  });

  describe('formatError', () => {
    it('should format Error objects', () => {
      const error = new Error('Test error');
      const result = formatError(error);
      expect(result.name).toBe('Error');
      expect(result.message).toBe('Test error');
      expect(result.stack).toBeDefined();
    });

    it('should format string errors', () => {
      const result = formatError('Something went wrong');
      expect(result.name).toBe('Error');
      expect(result.message).toBe('Something went wrong');
    });

    it('should handle unknown error types', () => {
      const result = formatError({ custom: 'error' });
      expect(result.name).toBe('UnknownError');
      expect(result.raw).toEqual({ custom: 'error' });
    });
  });

  describe('generateCorrelationId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[a-z0-9-]+$/i);
    });
  });

  describe('safeStringify', () => {
    it('should stringify simple objects', () => {
      const obj = { name: 'John', age: 30 };
      const result = safeStringify(obj);
      expect(result).toContain('name');
      expect(result).toContain('John');
    });

    it('should handle circular references', () => {
      const obj: any = { name: 'John' };
      obj.self = obj;
      const result = safeStringify(obj);
      expect(result).toContain('[Circular]');
    });

    it('should limit depth', () => {
      const deep = { a: { b: { c: { d: { e: { f: 'too deep' } } } } } };
      const result = safeStringify(deep, 3);
      expect(result).toContain('[Max Depth Exceeded]');
    });

    it('should handle functions', () => {
      const obj = { fn: function test() { } };
      const result = safeStringify(obj);
      expect(result).toContain('[Function: test]');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      const long = 'a'.repeat(100);
      const result = truncate(long, 50);
      expect(result.length).toBe(50);
      expect(result).toContain('...');
    });

    it('should not truncate short strings', () => {
      const short = 'short';
      const result = truncate(short, 50);
      expect(result).toBe('short');
    });
  });

  describe('getObjectSize', () => {
    it('should calculate object size', () => {
      const obj = { name: 'John', age: 30 };
      const size = getObjectSize(obj);
      expect(size).toBeGreaterThan(0);
    });

    it('should handle large objects', () => {
      const large = { data: 'x'.repeat(1000) };
      const size = getObjectSize(large);
      expect(size).toBeGreaterThan(1000);
    });
  });
});
