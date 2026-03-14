import { describe, it, expect } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
  it('should be properly configured', () => {
    expect(logger).toBeDefined();
  });

  it('should have info method', () => {
    expect(typeof logger.info).toBe('function');
  });

  it('should have error method', () => {
    expect(typeof logger.error).toBe('function');
  });

  it('should have warn method', () => {
    expect(typeof logger.warn).toBe('function');
  });

  it('should have debug method', () => {
    expect(typeof logger.debug).toBe('function');
  });

  it('should have trace method', () => {
    expect(typeof logger.trace).toBe('function');
  });

  it('should have fatal method', () => {
    expect(typeof logger.fatal).toBe('function');
  });

  it('should have a level property', () => {
    expect(logger.level).toBeDefined();
    expect(typeof logger.level).toBe('string');
  });

  it('should have child method for creating child loggers', () => {
    expect(typeof logger.child).toBe('function');
  });

  it('should be able to create child loggers', () => {
    const childLogger = logger.child({ module: 'test' });
    expect(childLogger).toBeDefined();
    expect(typeof childLogger.info).toBe('function');
  });
});

