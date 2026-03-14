// Shared types and utilities for App Shell

// ============================================================================
// API Types
// ============================================================================

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version?: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, string>;
}

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
}

// ============================================================================
// Validation Schemas (re-export from schemas.ts)
// ============================================================================

export {
  // Role-Based Access Control
  UserRole,
  ALL_ROLES,
  // Validation Schemas
  updateProfileSchema,
  loginSchema,
  registerSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type UpdateProfileFormValues,
  type UpdateProfileInput,
  type LoginInput,
  type RegisterInput,
  type ChangePasswordInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type FormErrors,
} from './schemas';

