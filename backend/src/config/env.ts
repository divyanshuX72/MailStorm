/**
 * Environment Configuration — Validated with Zod
 * Ensures all required env vars are present and correctly typed at startup
 */

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  APP_NAME: z.string().default('Email Campaign Manager'),
  APP_URL: z.string().url().default('http://localhost:5173'),
  API_URL: z.string().url().default('http://localhost:5000'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Encryption
  ENCRYPTION_KEY: z.string().length(32, 'ENCRYPTION_KEY must be exactly 32 characters'),
  ENCRYPTION_IV: z.string().length(16, 'ENCRYPTION_IV must be exactly 16 characters'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // File Uploads
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'),
  UPLOAD_DIR: z.string().default('./uploads'),

  // Logging
  LOG_LEVEL: z.string().default('dev'),

  // Email Defaults
  DEFAULT_FROM_EMAIL: z.string().email().default('noreply@example.com'),
  DEFAULT_FROM_NAME: z.string().default('Email Campaign Manager'),

  // Campaign Defaults
  DEFAULT_BATCH_SIZE: z.string().transform(Number).default('50'),
  DEFAULT_DELAY_MS: z.string().transform(Number).default('1000'),
  MAX_RETRY_ATTEMPTS: z.string().transform(Number).default('3'),

  // AI / OpenRouter
  OPENROUTER_API_KEY: z.string().optional().default(''),
  OPENROUTER_MODEL: z.string().optional().default('openrouter/auto'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
