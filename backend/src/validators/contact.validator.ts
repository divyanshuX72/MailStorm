/**
 * Contact Validators — Zod Schemas
 */

import { z } from 'zod';

export const createContactSchema = z.object({
  email: z.string().email('Invalid email address').max(255).toLowerCase().trim(),
  firstName: z.string().max(100).trim().optional().nullable(),
  lastName: z.string().max(100).trim().optional().nullable(),
  company: z.string().max(100).trim().optional().nullable(),
  phone: z.string().max(20).trim().optional().nullable(),
  tags: z.array(z.string().max(50)).optional(),
  groupName: z.string().max(100).trim().optional().nullable(),
});

export const updateContactSchema = createContactSchema.partial();

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one contact ID is required'),
});

export const contactQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  groupName: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BOUNCED', 'UNSUBSCRIBED']).optional(),
  tag: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
