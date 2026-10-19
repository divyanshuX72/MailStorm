/**
 * API Services — SMTP, Contacts, Templates, Campaigns, Reports
 */

import api from './api';
import type { ApiResponse, SmtpAccount, Contact, Template, Campaign, CampaignProgress, DashboardStats, PaginatedResponse, ContactImportResult, CampaignRecipient, ActivityLog } from '@/types';

// ============================================
// SMTP API
// ============================================

export const smtpApi = {
  getAll: () => api.get<ApiResponse<SmtpAccount[]>>('/smtp'),
  getById: (id: string) => api.get<ApiResponse<SmtpAccount>>(`/smtp/${id}`),
  create: (data: any) => api.post<ApiResponse<SmtpAccount>>('/smtp', data),
  update: (id: string, data: any) => api.put<ApiResponse<SmtpAccount>>(`/smtp/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/smtp/${id}`),
  test: (id: string, testEmail: string) => api.post<ApiResponse>(`/smtp/${id}/test`, { testEmail }),
  setDefault: (id: string) => api.patch<ApiResponse>(`/smtp/${id}/default`),
  toggleEnabled: (id: string) => api.patch<ApiResponse<{ isEnabled: boolean }>>(`/smtp/${id}/toggle`),
  getPresets: () => api.get<ApiResponse>('/smtp/presets'),
};

// ============================================
// CONTACTS API
// ============================================

export const contactsApi = {
  getAll: (params?: Record<string, string>) => api.get<ApiResponse<PaginatedResponse<Contact>>>('/contacts', { params }),
  getById: (id: string) => api.get<ApiResponse<Contact>>(`/contacts/${id}`),
  create: (data: any) => api.post<ApiResponse<Contact>>('/contacts', data),
  update: (id: string, data: any) => api.put<ApiResponse<Contact>>(`/contacts/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/contacts/${id}`),
  bulkDelete: (ids: string[]) => api.post<ApiResponse>('/contacts/bulk-delete', { ids }),
  import: (formData: FormData) => api.post<ApiResponse<ContactImportResult>>('/contacts/import', formData, {
    headers: { 'Content-Type': undefined }
  }),
  getGroups: () => api.get<ApiResponse<{ name: string; count: number }[]>>('/contacts/groups'),
  getTags: () => api.get<ApiResponse<string[]>>('/contacts/tags'),
};

// ============================================
// TEMPLATES API
// ============================================

export const templatesApi = {
  getAll: (params?: Record<string, string>) => api.get<ApiResponse<PaginatedResponse<Template>>>('/templates', { params }),
  getById: (id: string) => api.get<ApiResponse<Template>>(`/templates/${id}`),
  create: (data: any) => api.post<ApiResponse<Template>>('/templates', data),
  update: (id: string, data: any) => api.put<ApiResponse<Template>>(`/templates/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/templates/${id}`),
  preview: (data: { htmlContent: string; variables?: Record<string, string> }) => api.post<ApiResponse<{ html: string }>>('/templates/preview', data),
};

// ============================================
// CAMPAIGNS API
// ============================================

export const campaignsApi = {
  getAll: (params?: Record<string, string>) => api.get<ApiResponse<PaginatedResponse<Campaign>>>('/campaigns', { params }),
  getById: (id: string) => api.get<ApiResponse<Campaign>>(`/campaigns/${id}`),
  create: (data: any) => api.post<ApiResponse<Campaign>>('/campaigns', data),
  delete: (id: string) => api.delete<ApiResponse>(`/campaigns/${id}`),
  duplicate: (id: string) => api.post<ApiResponse<Campaign>>(`/campaigns/${id}/duplicate`),
  rerun: (id: string) => api.post<ApiResponse<Campaign>>(`/campaigns/${id}/rerun`),
  start: (id: string) => api.post<ApiResponse>(`/campaigns/${id}/start`),
  pause: (id: string) => api.post<ApiResponse>(`/campaigns/${id}/pause`),
  resume: (id: string) => api.post<ApiResponse>(`/campaigns/${id}/resume`),
  cancel: (id: string) => api.post<ApiResponse>(`/campaigns/${id}/cancel`),
  retryFailed: (id: string) => api.post<ApiResponse>(`/campaigns/${id}/retry`),
  getProgress: (id: string) => api.get<ApiResponse<CampaignProgress>>(`/campaigns/${id}/progress`),
  getRecipients: (id: string, params?: Record<string, string>) => api.get<ApiResponse<PaginatedResponse<CampaignRecipient>>>(`/campaigns/${id}/recipients`, { params }),
};

// ============================================
// REPORTS API
// ============================================

export const reportsApi = {
  getDashboard: () => api.get<ApiResponse<DashboardStats>>('/reports/dashboard'),
  getCampaignHistory: (limit?: number) => api.get<ApiResponse>('/reports/campaign-history', { params: { limit } }),
  getDailyReport: (days?: number) => api.get<ApiResponse>('/reports/daily', { params: { days } }),
  getMonthlyReport: (months?: number) => api.get<ApiResponse>('/reports/monthly', { params: { months } }),
  getSmtpUsage: () => api.get<ApiResponse>('/reports/smtp-usage'),
  getActivityLogs: (params?: Record<string, string>) => api.get<ApiResponse<{ logs: ActivityLog[]; total: number }>>('/reports/activity-logs', { params }),
  exportExcel: (type: 'daily' | 'monthly') => api.get('/reports/export/excel', { params: { type }, responseType: 'blob' }),
};
