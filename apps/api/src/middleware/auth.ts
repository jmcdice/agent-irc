import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@agent-irc/shared';
import { ApiError } from '../utils/errors';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';

// Extend Express Request type to include session user
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

// Extend Express Request to include user for role checking
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return next(ApiError.unauthorized());
  }
  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  // Just pass through - session will be available if user is logged in
  next();
}

/**
 * Middleware to require specific role(s) for access.
 * Must be used AFTER requireAuth middleware.
 *
 * @param roles - Single role or array of roles that are allowed
 * @example
 * // Single role
 * app.get('/admin', requireAuth, requireRole('admin'), handler);
 *
 * // Multiple roles
 * app.get('/manage', requireAuth, requireRole(['admin', 'manager']), handler);
 */
export function requireRole(roles: UserRole | UserRole[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated
      if (!req.session.userId) {
        return next(ApiError.unauthorized());
      }

      // Fetch user if not already loaded
      if (!req.user) {
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({ where: { id: req.session.userId } });
        if (!user) {
          return next(ApiError.unauthorized());
        }
        req.user = user;
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role as UserRole)) {
        return next(
          ApiError.forbidden(`Access denied. Required role: ${allowedRoles.join(' or ')}`)
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

