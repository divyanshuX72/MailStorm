/**
 * Campaign Validators — Zod Schemas
 */

import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200).trim(),
  subject: z.string().min(1, 'Subject is required').max(500).trim(),
  smtpAccountId: z.string().uuid('Invalid SMTP account ID'),
  templateId: z.string().uuid('Invalid template ID'),
  contactGroup: z.string().max(100).optional().nullable(),
  contactIds: z.array(z.string().uuid()).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  batchSize: z.number().int().min(1).max(500).optional(),
  delayMs: z.number().int().min(100).max(60000).optional(),
  retryAttempts: z.number().int().min(0).max(5).optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();
