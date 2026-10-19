/**
 * Frontend Type Definitions
 */

// User
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  avatar?: string;
  phone?: string;
  company?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// SMTP
export interface SmtpAccount {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  encryption: 'SSL' | 'TLS' | 'NONE';
  fromEmail: string;
  fromName: string;
  provider: 'GMAIL' | 'OUTLOOK' | 'ZOHO' | 'OFFICE365' | 'CUSTOM';
  isDefault: boolean;
  isEnabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
  sentToday: number;
  sentThisHour: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Contact
export interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  tags?: string;
  groupName?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BOUNCED' | 'UNSUBSCRIBED';
  isSubscribed: boolean;
  source?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Template
export interface Template {
  id: string;
  name: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  type: 'HTML' | 'PLAIN';
  variables?: string;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Campaign
export interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  totalRecipients: number;
  sent: number;
  failed: number;
  opened: number;
  clicked: number;
  bounced: number;
  batchSize: number;
  delayMs: number;
  retryAttempts: number;
  contactGroup?: string;
  userId: string;
  smtpAccountId: string;
  templateId: string;
  smtpAccount?: { name: string; provider: string };
  template?: { name: string };
  _count?: { recipients: number; attachments: number };
  createdAt: string;
  updatedAt: string;
}

// Campaign Recipient
export interface CampaignRecipient {
  id: string;
  status: 'PENDING' | 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED' | 'BOUNCED';
  sentAt?: string;
  error?: string;
  retryCount: number;
  contact: { email: string; firstName?: string; lastName?: string };
  createdAt: string;
}

// Campaign Progress
export interface CampaignProgress {
  campaignId: string;
  status: string;
  total: number;
  sent: number;
  failed: number;
  percentage: number;
  isActive: boolean;
}

// Dashboard Stats
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

// Activity Log
export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
  user?: { name: string; email: string };
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

// Pagination
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Import Result
export interface ContactImportResult {
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
  details: Array<{ row: number; email: string; error: string }>;
}
