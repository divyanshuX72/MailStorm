/**
 * Template Validators — Zod Schemas
 */

import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).trim(),
  subject: z.string().min(1, 'Subject is required').max(500).trim(),
  htmlContent: z.string().optional().nullable(),
  textContent: z.string().optional().nullable(),
  type: z.enum(['HTML', 'PLAIN']).default('HTML'),
  variables: z.array(z.string()).optional(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const previewTemplateSchema = z.object({
  htmlContent: z.string().optional(),
  textContent: z.string().optional(),
  variables: z.record(z.string()).optional(),
});
