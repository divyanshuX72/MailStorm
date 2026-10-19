/**
 * Application Constants
 */

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// JWT configuration
export const JWT = {
  ACCESS_TOKEN_COOKIE: 'access_token',
  REFRESH_TOKEN_COOKIE: 'refresh_token',
} as const;

// SMTP Provider presets
export const SMTP_PRESETS = {
  GMAIL: { host: 'smtp.gmail.com', port: 587, encryption: 'TLS' as const },
  OUTLOOK: { host: 'smtp.office365.com', port: 587, encryption: 'TLS' as const },
  ZOHO: { host: 'smtp.zoho.com', port: 465, encryption: 'SSL' as const },
  OFFICE365: { host: 'smtp.office365.com', port: 587, encryption: 'TLS' as const },
  CUSTOM: { host: '', port: 587, encryption: 'TLS' as const },
} as const;

// Campaign constants
export const CAMPAIGN = {
  MIN_BATCH_SIZE: 1,
  MAX_BATCH_SIZE: 500,
  MIN_DELAY_MS: 100,
  MAX_DELAY_MS: 60000,
  DEFAULT_BATCH_SIZE: 50,
  DEFAULT_DELAY_MS: 1000,
  MAX_RETRY: 3,
} as const;

// File upload limits
export const FILE = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMPORT_TYPES: ['.csv', '.xlsx', '.xls'],
  ALLOWED_ATTACHMENT_TYPES: ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.docx', '.zip'],
  ALLOWED_AVATAR_TYPES: ['.jpg', '.jpeg', '.png', '.webp'],
} as const;

// Activity log actions
export const ACTIVITY = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  IMPORT: 'IMPORT',
  EXPORT: 'EXPORT',
  SEND: 'SEND',
  PAUSE: 'PAUSE',
  RESUME: 'RESUME',
  CANCEL: 'CANCEL',
  TEST: 'TEST',
} as const;

// Entity names for activity logs
export const ENTITY = {
  USER: 'User',
  SMTP: 'SmtpAccount',
  CONTACT: 'Contact',
  TEMPLATE: 'Template',
  CAMPAIGN: 'Campaign',
  SETTING: 'Setting',
} as const;

// Email template variables
export const TEMPLATE_VARIABLES = [
  '{{name}}',
  '{{firstName}}',
  '{{lastName}}',
  '{{email}}',
  '{{company}}',
  '{{phone}}',
  '{{unsubscribeLink}}',
] as const;

// Rate limit tiers
export const RATE_LIMITS = {
  GENERAL: { windowMs: 15 * 60 * 1000, max: 100 },
  AUTH: { windowMs: 15 * 60 * 1000, max: 10 },
  EMAIL: { windowMs: 60 * 60 * 1000, max: 20 },
  UPLOAD: { windowMs: 15 * 60 * 1000, max: 30 },
} as const;
