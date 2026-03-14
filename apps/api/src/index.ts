// Validate environment variables first - fail fast if misconfigured
import { env, getDatabaseUrl } from './env';

import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pinoHttp from 'pino-http';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import type { HealthResponse } from '@agent-irc/shared';
import { AppDataSource } from './data-source';
import { User, PasswordResetToken, Session } from './entities';
import { requireAuth } from './middleware/auth';
import { errorHandler, asyncHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { ApiError } from './utils/errors';
import { sendPasswordResetEmail } from './utils/email';
import { getAllowedOrigins } from './utils/cors';
import { setupSwagger } from './swagger';
import { ircRouter, seedDefaultChannels } from './irc/router';
import path from 'path';
import fs from 'fs';

// Re-export for backwards compatibility
export { getAllowedOrigins } from './utils/cors';

const app = express();

// Setup Swagger documentation (before other routes)
setupSwagger(app);
const PORT = env.PORT;

// Session store
const PgSession = connectPgSimple(session);

// Middleware
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // In development, allow LAN access
    if (env.NODE_ENV !== 'production') {
      const lanPattern = /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/;
      if (lanPattern.test(origin)) return callback(null, true);
    }

    logger.warn({ origin, allowedOrigins }, 'CORS request from disallowed origin');
    callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());

// Session middleware
app.use(
  session({
    store: new PgSession({
      conString: getDatabaseUrl(),
      tableName: 'sessions',
      createTableIfMissing: true,
    }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

/**
 * @swagger
 * /healthz:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
app.get('/healthz', (_req, res) => {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  };
  res.json(response);
});

/**
 * @swagger
 * /readyz:
 *   get:
 *     summary: Readiness check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
app.get('/readyz', async (_req, res) => {
  try {
    await AppDataSource.query('SELECT 1');
    res.json({ status: 'ready', timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error({ err: error }, 'Readiness check failed');
    res.status(503).json({ status: 'not ready', error: 'Database connection failed' });
  }
});

/**
 * @swagger
 * /api/version:
 *   get:
 *     summary: Get API version info
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Version information
 */
app.get('/api/version', (_req, res) => {
  res.json({
    version: '0.1.0',
    buildDate: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

/**
 * @swagger
 * /api/auth/dev-login:
 *   post:
 *     summary: Development login (creates user if not exists)
 *     tags: [Auth]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               name: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
app.post('/api/auth/dev-login', asyncHandler(async (req, res) => {
  // Default dev user if no email provided
  const email = req.body.email || 'dev@example.com';
  const name = req.body.name || 'Dev User';

  const userRepo = AppDataSource.getRepository(User);
  let user = await userRepo.findOne({ where: { email } });

  if (!user) {
    user = userRepo.create({ email, name, role: 'admin' });
    await userRepo.save(user);
    logger.info({ userId: user.id, email }, 'New dev user created');
  }

  req.session.userId = user.id;
  logger.info({ userId: user.id }, 'User logged in via dev-login');

  res.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}));

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, password]
 *             properties:
 *               email: { type: string, format: email }
 *               name: { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { email, name, password } = req.body;

  // Validate required fields
  const validationErrors: Record<string, string> = {};
  if (!email) validationErrors.email = 'Email is required';
  if (!name || name.trim().length === 0) validationErrors.name = 'Name is required';
  if (!password) validationErrors.password = 'Password is required';
  else if (password.length < 8) validationErrors.password = 'Password must be at least 8 characters';

  if (Object.keys(validationErrors).length > 0) {
    throw ApiError.validationError('Validation failed', validationErrors);
  }

  const userRepo = AppDataSource.getRepository(User);
  const existingUser = await userRepo.findOne({ where: { email } });
  if (existingUser) {
    throw ApiError.alreadyExists('An account with this email');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = userRepo.create({ email, name: name.trim(), passwordHash, role: 'user' });
  await userRepo.save(user);
  logger.info({ userId: user.id, email }, 'New user registered');

  req.session.userId = user.id;
  res.status(201).json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw ApiError.badRequest('Email and password are required');
  }

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { email } });

  if (!user || !user.passwordHash) {
    throw ApiError.invalidCredentials();
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw ApiError.invalidCredentials();
  }

  req.session.userId = user.id;
  logger.info({ userId: user.id }, 'User logged in');

  res.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}));

/**
 * @swagger
 * /api/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [User]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */
app.get('/api/me', requireAuth, asyncHandler(async (req, res) => {
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id: req.session.userId } });

  if (!user) {
    throw ApiError.notFound('User');
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  });
}));

/**
 * @swagger
 * /api/me:
 *   put:
 *     summary: Update current user profile
 *     tags: [User]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               avatarUrl: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Not authenticated
 */
app.put('/api/me', requireAuth, asyncHandler(async (req, res) => {
  const { name, avatarUrl } = req.body;
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id: req.session.userId } });

  if (!user) {
    throw ApiError.notFound('User');
  }

  // Validate name if provided
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw ApiError.validationError('Name cannot be empty', { name: 'Name cannot be empty' });
    }
    user.name = name.trim();
  }

  // Validate avatarUrl if provided
  if (avatarUrl !== undefined) {
    if (avatarUrl !== null && typeof avatarUrl !== 'string') {
      throw ApiError.validationError('Invalid avatar URL', { avatarUrl: 'Invalid avatar URL' });
    }
    user.avatarUrl = avatarUrl || undefined;
  }

  await userRepo.save(user);
  logger.info({ userId: user.id }, 'User profile updated');

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  });
}));

/**
 * @swagger
 * /api/me/password:
 *   put:
 *     summary: Change password
 *     tags: [User]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password changed
 *       401:
 *         description: Not authenticated or invalid current password
 */
app.put('/api/me/password', requireAuth, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw ApiError.badRequest('Current password and new password are required');
  }

  if (newPassword.length < 8) {
    throw ApiError.validationError('Password must be at least 8 characters', {
      newPassword: 'Password must be at least 8 characters',
    });
  }

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id: req.session.userId } });

  if (!user) {
    throw ApiError.notFound('User');
  }

  if (!user.passwordHash) {
    throw ApiError.badRequest('Cannot change password for accounts without a password');
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    throw ApiError.validationError('Current password is incorrect', {
      currentPassword: 'Current password is incorrect',
    });
  }

  // Hash and save new password
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await userRepo.save(user);
  logger.info({ userId: user.id }, 'User password changed');

  res.json({ success: true, message: 'Password changed successfully' });
}));

// ============================================================================
// Session Management Endpoints
// ============================================================================

/**
 * @swagger
 * /api/me/sessions:
 *   get:
 *     summary: Get all active sessions
 *     tags: [Sessions]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: List of sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Session'
 */
app.get('/api/me/sessions', requireAuth, asyncHandler(async (req, res) => {
  const sessionRepo = AppDataSource.getRepository(Session);
  const currentUserId = req.session.userId;
  const currentSessionId = req.sessionID;

  // Find all sessions for this user that haven't expired
  const sessions = await sessionRepo
    .createQueryBuilder('session')
    .where("session.sess->>'userId' = :userId", { userId: currentUserId })
    .andWhere('session.expire > :now', { now: new Date() })
    .orderBy('session.expire', 'DESC')
    .getMany();

  // Format sessions for response
  const formattedSessions = sessions.map((s) => {
    const sessData = s.sess;
    return {
      id: s.sid,
      isCurrent: s.sid === currentSessionId,
      expiresAt: s.expire.toISOString(),
      createdAt: sessData.cookie?.originalMaxAge
        ? new Date(s.expire.getTime() - sessData.cookie.originalMaxAge).toISOString()
        : null,
    };
  });

  res.json({ sessions: formattedSessions });
}));

/**
 * @swagger
 * /api/me/sessions/{sessionId}:
 *   delete:
 *     summary: Revoke a specific session
 *     tags: [Sessions]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session revoked
 *       400:
 *         description: Cannot revoke current session
 *       404:
 *         description: Session not found
 */
app.delete('/api/me/sessions/:sessionId', requireAuth, asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const sessionRepo = AppDataSource.getRepository(Session);
  const currentUserId = req.session.userId;

  // Prevent revoking current session via this endpoint
  if (sessionId === req.sessionID) {
    throw ApiError.badRequest('Cannot revoke current session. Use logout instead.');
  }

  // Find the session and verify it belongs to current user
  const session = await sessionRepo.findOne({ where: { sid: sessionId } });

  if (!session) {
    throw ApiError.notFound('Session');
  }

  // Verify the session belongs to the current user
  if (session.sess?.userId !== currentUserId) {
    throw ApiError.forbidden('Cannot revoke sessions belonging to other users');
  }

  // Delete the session
  await sessionRepo.delete({ sid: sessionId });

  logger.info({ userId: currentUserId, revokedSessionId: sessionId }, 'Session revoked');

  res.json({ success: true, message: 'Session revoked successfully' });
}));

/**
 * @swagger
 * /api/me/sessions:
 *   delete:
 *     summary: Revoke all other sessions (logout everywhere else)
 *     tags: [Sessions]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: All other sessions revoked
 */
app.delete('/api/me/sessions', requireAuth, asyncHandler(async (req, res) => {
  const sessionRepo = AppDataSource.getRepository(Session);
  const currentUserId = req.session.userId;
  const currentSessionId = req.sessionID;

  // Delete all sessions for this user except current one
  const result = await sessionRepo
    .createQueryBuilder()
    .delete()
    .from(Session)
    .where("sess->>'userId' = :userId", { userId: currentUserId })
    .andWhere('sid != :currentSid', { currentSid: currentSessionId })
    .execute();

  logger.info(
    { userId: currentUserId, revokedCount: result.affected },
    'All other sessions revoked'
  );

  res.json({
    success: true,
    message: `Revoked ${result.affected || 0} other session(s)`,
    revokedCount: result.affected || 0,
  });
}));

// ============================================================================
// Password Reset Endpoints
// ============================================================================

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Reset email sent (or would be if email exists)
 */
app.post('/api/auth/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw ApiError.validationError('Email is required', { email: 'Email is required' });
  }

  const userRepo = AppDataSource.getRepository(User);
  const resetTokenRepo = AppDataSource.getRepository(PasswordResetToken);

  // Find user by email
  const user = await userRepo.findOne({ where: { email } });

  // Always respond with success to prevent email enumeration
  // Even if user doesn't exist, we don't reveal that
  if (!user) {
    logger.info({ email }, 'Password reset requested for non-existent email');
    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
    return;
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');

  // Token expires in 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Invalidate any existing tokens for this user
  await resetTokenRepo.update(
    { userId: user.id, usedAt: undefined },
    { usedAt: new Date() }
  );

  // Create new token
  const resetToken = resetTokenRepo.create({
    token,
    userId: user.id,
    expiresAt,
  });
  await resetTokenRepo.save(resetToken);

  // Send email
  const emailSent = await sendPasswordResetEmail(email, token, env.WEB_URL);

  if (!emailSent) {
    logger.error({ userId: user.id }, 'Failed to send password reset email');
  }

  logger.info({ userId: user.id }, 'Password reset token created');

  res.json({
    success: true,
    message: 'If an account exists with this email, you will receive a password reset link.',
  });
}));

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using token from email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
app.post('/api/auth/reset-password', asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token) {
    throw ApiError.validationError('Token is required', { token: 'Token is required' });
  }

  if (!password || password.length < 8) {
    throw ApiError.validationError('Password must be at least 8 characters', {
      password: 'Password must be at least 8 characters',
    });
  }

  const resetTokenRepo = AppDataSource.getRepository(PasswordResetToken);
  const userRepo = AppDataSource.getRepository(User);

  // Find the token
  const resetToken = await resetTokenRepo.findOne({
    where: { token },
    relations: ['user'],
  });

  if (!resetToken) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  if (!resetToken.isValid()) {
    throw ApiError.badRequest('This password reset link has expired');
  }

  // Hash new password and update user
  const user = resetToken.user;
  user.passwordHash = await bcrypt.hash(password, 10);
  await userRepo.save(user);

  // Mark token as used
  resetToken.usedAt = new Date();
  await resetTokenRepo.save(resetToken);

  logger.info({ userId: user.id }, 'Password reset successfully');

  res.json({
    success: true,
    message: 'Password has been reset successfully. You can now log in with your new password.',
  });
}));

/**
 * @swagger
 * /api/auth/verify-reset-token:
 *   get:
 *     summary: Verify if a password reset token is valid
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token validity status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid: { type: boolean }
 */
app.get('/api/auth/verify-reset-token', asyncHandler(async (req, res) => {
  const token = req.query.token as string;

  if (!token) {
    throw ApiError.badRequest('Token is required');
  }

  const resetTokenRepo = AppDataSource.getRepository(PasswordResetToken);

  const resetToken = await resetTokenRepo.findOne({
    where: { token },
  });

  if (!resetToken || !resetToken.isValid()) {
    res.json({ valid: false });
    return;
  }

  res.json({ valid: true });
}));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Auth]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
app.post('/api/auth/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error({ err }, 'Logout error');
      return next(ApiError.internal('Logout failed'));
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// ─── Agent IRC Routes ──────────────────────────────────────────────────────────

// Mount IRC API at /api/v1
app.use('/api/v1', ircRouter);

// Serve skill.md — the file agents load to join Agent IRC
app.get('/skill.md', (_req, res) => {
  const skillPath = path.resolve(__dirname, '../../../../skill.md');
  if (fs.existsSync(skillPath)) {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.sendFile(skillPath);
  } else {
    res.status(404).json({ error: 'skill.md not found' });
  }
});

// Error handler middleware - must be registered LAST
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    await AppDataSource.initialize();
    logger.info('Database connection established');
    await seedDefaultChannels();
    logger.info('Default channels seeded');

    app.listen(PORT, () => {
      logger.info({ port: PORT }, 'Server started');
      logger.info(`Health check: http://localhost:${PORT}/healthz`);
      logger.info(`Readiness check: http://localhost:${PORT}/readyz`);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Only start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { app };

