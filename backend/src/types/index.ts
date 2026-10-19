/**
 * Type Definitions — Core Application Types
 */

import { Request } from 'express';
export type UserRole = 'ADMIN' | 'USER';

// ============================================
// AUTH TYPES
// ============================================

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  company?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

// ============================================
// SMTP TYPES
// ============================================

export interface SmtpInput {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: 'SSL' | 'TLS' | 'NONE';
  fromEmail: string;
  fromName: string;
  provider: 'GMAIL' | 'OUTLOOK' | 'ZOHO' | 'OFFICE365' | 'CUSTOM';
  maxPerHour?: number;
  maxPerDay?: number;
}

export interface SmtpTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
}

// ============================================
// CONTACT TYPES
// ============================================

export interface ContactInput {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  tags?: string[];
  groupName?: string;
}

export interface ContactImportResult {
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
  details: Array<{ row: number; email: string; error: string }>;
}

// ============================================
// TEMPLATE TYPES
// ============================================

export interface TemplateInput {
  name: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  type: 'HTML' | 'PLAIN';
  variables?: string[];
}

// ============================================
// CAMPAIGN TYPES
// ============================================

export interface CampaignInput {
  name: string;
  subject: string;
  smtpAccountId: string;
  templateId: string;
  contactGroup?: string;
  contactIds?: string[];
  scheduledAt?: string;
  batchSize?: number;
  delayMs?: number;
  retryAttempts?: number;
}

export interface CampaignProgress {
  campaignId: string;
  status: string;
  total: number;
  sent: number;
  failed: number;
  percentage: number;
}

// ============================================
// COMMON TYPES
// ============================================

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

export interface DashboardStats {
  totalContacts: number;
  totalCampaigns: number;
  emailsSent: number;
  emailsPending: number;
  emailsFailed: number;
  successRate: number;
  smtpAccounts: number;
  templates: number;
}
