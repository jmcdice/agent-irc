import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  parseApiResponse,
  apiRequest,
  useApiMutation,
  isErrorCode,
  getFieldError,
} from '../use-api';

describe('parseApiResponse', () => {
  it('should parse successful response', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 1, name: 'Test' }),
    } as unknown as Response;

    const result = await parseApiResponse<{ id: number; name: string }>(mockResponse);

    expect(result.data).toEqual({ id: 1, name: 'Test' });
    expect(result.error).toBeNull();
  });

  it('should parse error response', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({
        error: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: { email: 'Invalid email format' },
      }),
    } as unknown as Response;

    const result = await parseApiResponse(mockResponse);

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      error: 'VALIDATION_ERROR',
      message: 'Invalid input',
      statusCode: 400,
      details: { email: 'Invalid email format' },
    });
  });

  it('should handle JSON parse errors', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
    } as unknown as Response;

    const result = await parseApiResponse(mockResponse);

    expect(result.data).toBeNull();
    expect(result.error?.error).toBe('NETWORK_ERROR');
  });
});

describe('apiRequest', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should make request with correct options', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    await apiRequest('/api/test', { method: 'POST', body: JSON.stringify({ data: 'test' }) });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/test'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    );
  });

  it('should handle network errors', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const result = await apiRequest('/api/test');

    expect(result.error?.error).toBe('NETWORK_ERROR');
    expect(result.data).toBeNull();
  });
});

describe('useApiMutation', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should execute mutation and return data', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 1 }),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useApiMutation('/api/test', 'POST'));

    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      await result.current.execute({ name: 'test' });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 1 });
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle errors in mutation', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ error: 'BAD_REQUEST', message: 'Invalid data' }),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useApiMutation('/api/test', 'POST'));

    await act(async () => {
      await result.current.execute({});
    });

    expect(result.current.error?.error).toBe('BAD_REQUEST');
    expect(result.current.data).toBeNull();
  });

  it('should reset state', async () => {
    const { result } = renderHook(() => useApiMutation('/api/test', 'POST'));

    act(() => result.current.reset());

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('utility functions', () => {
  it('isErrorCode should match error codes', () => {
    const error = { error: 'VALIDATION_ERROR', message: 'Test', statusCode: 400 };

    expect(isErrorCode(error, 'VALIDATION_ERROR')).toBe(true);
    expect(isErrorCode(error, 'OTHER_ERROR')).toBe(false);
    expect(isErrorCode(null, 'VALIDATION_ERROR')).toBe(false);
  });

  it('getFieldError should return field-specific errors', () => {
    const error = {
      error: 'VALIDATION_ERROR',
      message: 'Test',
      statusCode: 400,
      details: { email: 'Invalid email', name: 'Required' },
    };

    expect(getFieldError(error, 'email')).toBe('Invalid email');
    expect(getFieldError(error, 'unknown')).toBeUndefined();
    expect(getFieldError(null, 'email')).toBeUndefined();
  });
});

