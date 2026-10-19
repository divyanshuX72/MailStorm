/**
 * CLI — Shared Type Definitions
 * Mirror of backend agent types + CLI-specific types
 */

// ============================================
// AGENT TYPES (mirrored from backend)
// ============================================

export interface AgentManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'active' | 'coming_soon' | 'disabled';
  icon: string;
  category: string;
  commandCount: number;
  capabilities: string[];
  commands?: AgentCommand[];
}

export interface AgentCommand {
  name: string;
  description: string;
  usage?: string;
  aliases?: string[];
  requiresArgs?: boolean;
  interactive?: boolean;
}

export interface AgentExecuteResult {
  success: boolean;
  message: string;
  data?: any;
  prompt?: AgentPrompt;
  error?: string;
  meta?: {
    duration?: number;
    agentId?: string;
    action?: string;
    timestamp?: string;
  };
}

export interface AgentPrompt {
  type: 'select' | 'input' | 'confirm' | 'multiselect';
  message: string;
  choices?: AgentPromptChoice[];
  defaultValue?: string;
  field: string;
}

export interface AgentPromptChoice {
  name: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

export interface AutocompleteSuggestion {
  value: string;
  label: string;
  description?: string;
  category?: string;
}

export interface AgentHistoryEntry {
  id: string;
  agentId: string;
  command: string;
  action: string;
  result: 'success' | 'error' | 'pending';
  message: string;
  timestamp: string;
  duration?: number;
}

// ============================================
// CLI-SPECIFIC TYPES
// ============================================

export interface CLIConfig {
  apiUrl: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  workspace?: string;
  theme?: 'dark' | 'light';
  lastLogin?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

// ============================================
// TEMPLATE / GROUP / SMTP TYPES
// ============================================

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactGroup {
  name: string;
  contactCount: number;
}

export interface SmtpAccount {
  id: string;
  name: string;
  host: string;
  port: number;
  fromEmail: string;
  fromName: string;
  provider: string;
  isDefault: boolean;
  isEnabled: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  totalRecipients: number;
  sent: number;
  failed: number;
  contactGroup: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  template?: { name: string };
  smtpAccount?: { name: string };
}
