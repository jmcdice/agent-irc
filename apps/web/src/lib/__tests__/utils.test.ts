import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn (className merger)', () => {
  describe('basic functionality', () => {
    it('should merge multiple class strings', () => {
      const result = cn('foo', 'bar', 'baz');
      expect(result).toBe('foo bar baz');
    });

    it('should return empty string for no input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle single class', () => {
      const result = cn('single-class');
      expect(result).toBe('single-class');
    });
  });

  describe('handling undefined and null values', () => {
    it('should filter out undefined values', () => {
      const result = cn('foo', undefined, 'bar');
      expect(result).toBe('foo bar');
    });

    it('should filter out null values', () => {
      const result = cn('foo', null, 'bar');
      expect(result).toBe('foo bar');
    });

    it('should handle all undefined/null inputs', () => {
      const result = cn(undefined, null, undefined);
      expect(result).toBe('');
    });
  });

  describe('conditional classes', () => {
    it('should handle conditional classes with boolean', () => {
      const isActive = true;
      const result = cn('base', isActive && 'active');
      expect(result).toBe('base active');
    });

    it('should filter out false conditions', () => {
      const isActive = false;
      const result = cn('base', isActive && 'active');
      expect(result).toBe('base');
    });

    it('should handle object syntax for conditionals', () => {
      const result = cn('base', { active: true, disabled: false });
      expect(result).toBe('base active');
    });
  });

  describe('Tailwind class merging', () => {
    it('should properly merge conflicting Tailwind width classes', () => {
      const result = cn('w-10', 'w-20');
      expect(result).toBe('w-20');
    });

    it('should properly merge conflicting Tailwind padding classes', () => {
      const result = cn('p-2', 'p-4');
      expect(result).toBe('p-4');
    });

    it('should properly merge conflicting Tailwind margin classes', () => {
      const result = cn('m-2', 'm-4');
      expect(result).toBe('m-4');
    });

    it('should properly merge conflicting Tailwind text color classes', () => {
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toBe('text-blue-500');
    });

    it('should properly merge conflicting Tailwind background classes', () => {
      const result = cn('bg-red-500', 'bg-blue-500');
      expect(result).toBe('bg-blue-500');
    });

    it('should keep non-conflicting classes', () => {
      const result = cn('p-2', 'text-red-500', 'bg-blue-500');
      expect(result).toBe('p-2 text-red-500 bg-blue-500');
    });

    it('should handle responsive prefixes correctly', () => {
      const result = cn('p-2', 'md:p-4', 'lg:p-6');
      expect(result).toBe('p-2 md:p-4 lg:p-6');
    });
  });

  describe('array inputs', () => {
    it('should handle array of classes', () => {
      const result = cn(['foo', 'bar', 'baz']);
      expect(result).toBe('foo bar baz');
    });

    it('should handle nested arrays', () => {
      const result = cn(['foo', ['bar', 'baz']]);
      expect(result).toBe('foo bar baz');
    });
  });
});

