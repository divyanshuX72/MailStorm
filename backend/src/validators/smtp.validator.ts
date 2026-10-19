/**
 * SMTP Validators — Zod Schemas
 */

import { z } from 'zod';

export const createSmtpSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  host: z.string().min(1, 'Host is required').max(255).trim(),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1, 'Username is required').max(255).trim(),
  password: z.string().min(1, 'Password is required'),
  encryption: z.enum(['SSL', 'TLS', 'NONE']).default('TLS'),
  fromEmail: z.string().email('Invalid from email').max(255).trim(),
  fromName: z.string().min(1, 'From name is required').max(100).trim(),
  provider: z.enum(['GMAIL', 'OUTLOOK', 'ZOHO', 'OFFICE365', 'CUSTOM']).default('CUSTOM'),
  maxPerHour: z.number().int().min(1).max(10000).optional(),
  maxPerDay: z.number().int().min(1).max(100000).optional(),
});

export const updateSmtpSchema = createSmtpSchema.partial().omit({ password: true }).extend({
  password: z.string().optional(), // Password is optional on update
});

export const testSmtpSchema = z.object({
  testEmail: z.string().email('Invalid test email address').trim(),
});
