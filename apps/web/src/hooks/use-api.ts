/**
 * useApi Hook - Consistent API calls with error handling
 *
 * Usage:
 *   const { data, error, isLoading, mutate } = useApi('/api/me');
 *   const { execute } = useApiMutation('/api/auth/login', 'POST');
 */

import { useState, useCallback } from 'react';
import type { ApiError } from '@agent-irc/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

/**
 * Result of parsing an API response
 */
export interface ApiResult<T> {
  data: T | null;
  error: ApiError | null;
}

/**
 * Parse an API response, handling both success and error cases
 */
export async function parseApiResponse<T>(response: Response): Promise<ApiResult<T>> {
  try {
    const body = await response.json();

    if (!response.ok) {
      // Server returned an error response
      const error: ApiError = {
        error: body.error || 'UNKNOWN_ERROR',
        message: body.message || 'An unexpected error occurred',
        statusCode: response.status,
        details: body.details,
      };
      return { data: null, error };
    }

    return { data: body as T, error: null };
  } catch {
    // Failed to parse response (network error, invalid JSON, etc.)
    return {
      data: null,
      error: {
        error: 'NETWORK_ERROR',
        message: 'Failed to connect to the server',
        statusCode: 0,
      },
    };
  }
}

/**
 * Make an API request with consistent error handling
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    return parseApiResponse<T>(response);
  } catch {
    return {
      data: null,
      error: {
        error: 'NETWORK_ERROR',
        message: 'Failed to connect to the server',
        statusCode: 0,
      },
    };
  }
}

/**
 * Hook for making API mutations (POST, PUT, DELETE)
 */
export function useApiMutation<TRequest, TResponse>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST'
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<TResponse | null>(null);

  const execute = useCallback(
    async (body?: TRequest): Promise<ApiResult<TResponse>> => {
      setIsLoading(true);
      setError(null);

      const result = await apiRequest<TResponse>(endpoint, {
        method,
        body: body ? JSON.stringify(body) : undefined,
      });

      setIsLoading(false);
      setData(result.data);
      setError(result.error);

      return result;
    },
    [endpoint, method]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { execute, isLoading, error, data, reset };
}

/**
 * Check if an error is a specific error code
 */
export function isErrorCode(error: ApiError | null, code: string): boolean {
  return error?.error === code;
}

/**
 * Get validation error message for a specific field
 */
export function getFieldError(error: ApiError | null, field: string): string | undefined {
  return error?.details?.[field];
}

