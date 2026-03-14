/**
 * Standardized API Error Handling
 *
 * Use these utilities to throw and handle errors consistently across the API.
 * All errors thrown with ApiError will be caught by the error middleware
 * and returned in a consistent format.
 */

// Standard error codes for common scenarios
export const ErrorCodes = {
  // 400 Bad Request
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // 401 Unauthorized
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // 403 Forbidden
  FORBIDDEN: 'FORBIDDEN',

  // 404 Not Found
  NOT_FOUND: 'NOT_FOUND',

  // 409 Conflict
  CONFLICT: 'CONFLICT',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // 500 Internal Server Error
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Custom error class for API errors.
 * Throw this in route handlers to return a consistent error response.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, string>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = ErrorCodes.INTERNAL_ERROR,
    details?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert to JSON response format
   */
  toJSON() {
    return {
      error: this.code,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details }),
    };
  }

  // ============================================================================
  // Factory methods for common error types
  // ============================================================================

  static badRequest(message: string, details?: Record<string, string>): ApiError {
    return new ApiError(message, 400, ErrorCodes.BAD_REQUEST, details);
  }

  static validationError(message: string, details?: Record<string, string>): ApiError {
    return new ApiError(message, 400, ErrorCodes.VALIDATION_ERROR, details);
  }

  static unauthorized(message: string = 'Authentication required'): ApiError {
    return new ApiError(message, 401, ErrorCodes.UNAUTHORIZED);
  }

  static invalidCredentials(message: string = 'Invalid email or password'): ApiError {
    return new ApiError(message, 401, ErrorCodes.INVALID_CREDENTIALS);
  }

  static forbidden(message: string = 'Access denied'): ApiError {
    return new ApiError(message, 403, ErrorCodes.FORBIDDEN);
  }

  static notFound(resource: string = 'Resource'): ApiError {
    return new ApiError(`${resource} not found`, 404, ErrorCodes.NOT_FOUND);
  }

  static conflict(message: string): ApiError {
    return new ApiError(message, 409, ErrorCodes.CONFLICT);
  }

  static alreadyExists(resource: string = 'Resource'): ApiError {
    return new ApiError(`${resource} already exists`, 409, ErrorCodes.ALREADY_EXISTS);
  }

  static internal(message: string = 'An unexpected error occurred'): ApiError {
    return new ApiError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

