import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireAuth, optionalAuth } from '../auth';
import { ApiError } from '../../utils/errors';

// Mock request, response, and next function
const mockRequest = (sessionData: { userId?: string } = {}) => {
  return {
    session: sessionData,
  } as unknown as Request;
};

const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

let mockNext: NextFunction;

describe('requireAuth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNext = vi.fn();
  });

  it('should call next() when userId is present in session', () => {
    const req = mockRequest({ userId: 'user-123' });
    const res = mockResponse();

    requireAuth(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(); // Called with no arguments (success)
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should call next with ApiError.unauthorized when userId is undefined', () => {
    const req = mockRequest({});
    const res = mockResponse();

    requireAuth(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    const passedError = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(passedError).toBeInstanceOf(ApiError);
    expect(passedError.statusCode).toBe(401);
    expect(passedError.code).toBe('UNAUTHORIZED');
  });

  it('should call next with ApiError when session has no userId property', () => {
    const req = mockRequest();
    const res = mockResponse();

    requireAuth(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    const passedError = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(passedError).toBeInstanceOf(ApiError);
    expect(passedError.statusCode).toBe(401);
  });

  it('should pass error with proper structure for error handler', () => {
    const req = mockRequest({});
    const res = mockResponse();

    requireAuth(req, res, mockNext);

    const passedError = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(passedError).toBeInstanceOf(ApiError);
    expect(passedError.toJSON()).toEqual(
      expect.objectContaining({
        error: 'UNAUTHORIZED',
        message: expect.any(String),
        statusCode: 401,
      })
    );
  });
});

describe('optionalAuth middleware', () => {
  let nextFn: NextFunction & ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    nextFn = vi.fn() as NextFunction & ReturnType<typeof vi.fn>;
  });

  it('should always call next() regardless of session state', () => {
    const req = mockRequest({});
    const res = mockResponse();

    optionalAuth(req, res, nextFn);

    expect(nextFn).toHaveBeenCalledTimes(1);
  });

  it('should call next() when userId is present', () => {
    const req = mockRequest({ userId: 'user-123' });
    const res = mockResponse();

    optionalAuth(req, res, nextFn);

    expect(nextFn).toHaveBeenCalledTimes(1);
  });

  it('should call next() when userId is undefined', () => {
    const req = mockRequest({ userId: undefined });
    const res = mockResponse();

    optionalAuth(req, res, nextFn);

    expect(nextFn).toHaveBeenCalledTimes(1);
  });

  it('should not modify request or response', () => {
    const req = mockRequest({ userId: 'user-123' });
    const res = mockResponse();

    optionalAuth(req, res, nextFn);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});

