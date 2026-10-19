/**
 * Agent System — Shared Type Definitions
 * Core types used across all agents and the agent registry
 */

// ============================================
// AGENT MANIFEST
// ============================================

export interface AgentCommand {
  /** Command name (e.g., "/template", "/send") */
  name: string;
  /** Short description shown in help */
  description: string;
  /** Detailed usage info */
  usage?: string;
  /** Command aliases (e.g., ["/t"] for "/template") */
  aliases?: string[];
  /** Whether this command requires arguments */
  requiresArgs?: boolean;
  /** Whether this command supports interactive mode */
  interactive?: boolean;
}

export interface AgentManifest {
  /** Unique agent identifier (e.g., "email", "lead", "crm") */
  id: string;
  /** Display name (e.g., "Email Agent") */
  name: string;
  /** Short description */
  description: string;
  /** Semver version */
  version: string;
  /** Agent operational status */
  status: 'active' | 'coming_soon' | 'disabled';
  /** Icon emoji for CLI display */
  icon: string;
  /** List of supported commands */
  commands: AgentCommand[];
  /** High-level capabilities list */
  capabilities: string[];
  /** Agent category for grouping */
  category: 'core' | 'communication' | 'sales' | 'intelligence' | 'operations';
}

// ============================================
// AGENT CONTEXT
// ============================================

export interface AgentContext {
  userId: string;
  email: string;
  role: string;
  agentId: string;
  sessionId?: string;
}

// ============================================
// EXECUTION TYPES
// ============================================

export interface AgentExecuteRequest {
  /** The command or natural language input */
  command: string;
  /** Parsed command name (if applicable) */
  action?: string;
  /** Additional parameters */
  params?: Record<string, unknown>;
  /** Whether to run in interactive mode */
  interactive?: boolean;
}

export interface AgentExecuteResult {
  success: boolean;
  /** Human-readable message */
  message: string;
  /** Structured data payload */
  data?: unknown;
  /** If the command requires further user input */
  prompt?: AgentPrompt;
  /** Error details */
  error?: string;
  /** Execution metadata */
  meta?: {
    duration?: number;
    agentId?: string;
    action?: string;
    timestamp?: string;
  };
}

export interface AgentPrompt {
  /** Prompt type */
  type: 'select' | 'input' | 'confirm' | 'multiselect';
  /** Question to display */
  message: string;
  /** Options for select/multiselect */
  choices?: AgentPromptChoice[];
  /** Default value */
  defaultValue?: string;
  /** Field name to populate */
  field: string;
}

export interface AgentPromptChoice {
  name: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

// ============================================
// AUTOCOMPLETE TYPES
// ============================================

export interface AutocompleteRequest {
  /** Partial input to complete */
  partial: string;
  /** Context: which field is being completed */
  context?: 'command' | 'template' | 'group' | 'smtp' | 'campaign' | 'company' | 'customer';
}

export interface AutocompleteResult {
  suggestions: AutocompleteSuggestion[];
}

export interface AutocompleteSuggestion {
  value: string;
  label: string;
  description?: string;
  category?: string;
}

// ============================================
// AGENT HISTORY
// ============================================

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
// AGENT STATUS
// ============================================

export interface AgentStatus {
  agentId: string;
  name: string;
  status: 'active' | 'coming_soon' | 'disabled';
  stats?: Record<string, number | string>;
  lastActivity?: string;
}
