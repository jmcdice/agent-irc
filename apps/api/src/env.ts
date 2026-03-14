import { z } from 'zod';

/**
 * Environment variable validation schema
 * This ensures all required env vars are present and properly typed at startup
 */
const envSchema = z.object({
  // Server
  PORT: z
    .string()
    .default('4000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database - individual connection params
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z
    .string()
    .default('5432')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),
  DB_USER: z.string().default('app_user'),
  DB_PASSWORD: z.string().default('app_pass'),
  DB_NAME: z.string().default('app_db'),

  // Database URL for session store (optional - constructed from individual params if not provided)
  DATABASE_URL: z.string().optional(),

  // Session - required in production
  SESSION_SECRET: z.string().min(1, 'SESSION_SECRET is required'),

  // CORS
  WEB_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGINS: z.string().optional(),
});

// In development/test, provide a default session secret
const envWithDefaults = {
  ...process.env,
  SESSION_SECRET:
    process.env.SESSION_SECRET ||
    (process.env.NODE_ENV !== 'production' ? 'dev-session-secret-change-in-production' : undefined),
};

function validateEnv() {
  const result = envSchema.safeParse(envWithDefaults);

  if (!result.success) {
    console.error('❌ Environment validation failed:');
    console.error('');

    const errors = result.error.flatten();

    // Field-specific errors
    for (const [field, messages] of Object.entries(errors.fieldErrors)) {
      console.error(`  ${field}:`);
      for (const message of messages || []) {
        console.error(`    - ${message}`);
      }
    }

    // Form-level errors
    for (const message of errors.formErrors) {
      console.error(`  - ${message}`);
    }

    console.error('');
    console.error('💡 Required environment variables:');
    console.error('  - SESSION_SECRET (required in production)');
    console.error('');
    console.error('💡 Optional environment variables:');
    console.error('  - PORT (default: 4000)');
    console.error('  - NODE_ENV (default: development)');
    console.error('  - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME');
    console.error('  - DATABASE_URL (for session store)');
    console.error('  - WEB_URL (default: http://localhost:3000)');
    console.error('  - CORS_ORIGINS (comma-separated list)');

    process.exit(1);
  }

  return result.data;
}

// Validate and export the parsed env
export const env = validateEnv();

// Helper to get database URL (either from env or constructed)
export function getDatabaseUrl(): string {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }
  return `postgres://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;
}

// Export type for use elsewhere
export type Env = typeof env;

