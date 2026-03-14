/**
 * CORS utilities for the API
 */

import { env } from '../env';

/**
 * Build list of allowed CORS origins based on environment configuration
 */
export const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];
  origins.push(env.WEB_URL);

  if (env.CORS_ORIGINS) {
    origins.push(...env.CORS_ORIGINS.split(',').map((o) => o.trim()));
  }

  if (env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3001');
    origins.push('http://127.0.0.1:3000');
    origins.push('http://127.0.0.1:3001');
  }

  return origins;
};

