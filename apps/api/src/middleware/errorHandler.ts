/**
 * Express Error Handling Middleware
 *
 * This middleware catches all errors thrown in route handlers and returns
 * a consistent JSON response format. It should be registered LAST in the
 * middleware chain.
 *
 * Usage:
 *   app.use(errorHandler);
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Error handler middleware
 *
 * Catches errors thrown in route handlers and returns a consistent JSON response.
 * - ApiError instances: Returns the error details as-is
 * - Other errors: Logs the error and returns a generic 500 response
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Handle known API errors
  if (err instanceof ApiError) {
    logger.warn(
      {
        code: err.code,
        statusCode: err.statusCode,
        message: err.message,
        details: err.details,
        path: req.path,
        method: req.method,
      },
      'API error'
    );

    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Handle unexpected errors
  logger.error(
    {
      err,
      path: req.path,
      method: req.method,
      body: req.body,
    },
    'Unexpected error'
  );

  // Don't leak error details in production
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message || 'An unexpected error occurred';

  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message,
    statusCode: 500,
  });
}

/**
 * Async handler wrapper
 *
 * Wraps async route handlers to automatically catch rejected promises
 * and forward them to the error handler middleware.
 *
 * Usage:
 *   app.get('/route', asyncHandler(async (req, res) => {
 *     const data = await someAsyncOperation();
 *     res.json(data);
 *   }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

