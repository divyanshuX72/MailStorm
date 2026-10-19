/**
 * AI API Service — Frontend API calls for AI Command module
 */

import api from './api';
import type { ApiResponse } from '@/types';

// ============================================
// AI COMMAND TYPES
// ============================================

export interface AICommandResponse {
  status: 'success' | 'error';
  stage: 'parsing' | 'validation' | 'execution' | 'completed';
  parsedCommand: {
    action: string;
    group?: string;
    template?: string;
    smtp?: string;
    campaign?: string;
  } | null;
  validation: {
    valid: boolean;
    errors?: string[];
    resolved?: {
      action: string;
      groupName?: string;
      templateName?: string;
      smtpName?: string;
      contactCount?: number;
      campaignName?: string;
      campaignId?: string;
    };
  } | null;
  execution: {
    success: boolean;
    message: string;
    campaignId?: string;
    campaignName?: string;
    error?: string;
  } | null;
  error: string | null;
}

// ============================================
// AI API
// ============================================

export const aiApi = {
  executeCommand: (command: string) =>
    api.post<ApiResponse<AICommandResponse>>('/ai-command', { command }),
};
