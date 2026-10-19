/**
 * Agent System — Bootstrap
 * Imports all agent manifests to trigger self-registration,
 * then exports the registry for use by the router.
 */

// Import all agent manifests — each one self-registers with the registry
import './email/manifest';
import './main/manifest';
import './lead/manifest';
import './crm/manifest';
import './proposal/manifest';
import './research/manifest';
import './meeting/manifest';
import './analytics/manifest';

// Re-export registry and types
export { agentRegistry } from './registry';
export type {
  AgentManifest,
  AgentCommand,
  AgentContext,
  AgentExecuteRequest,
  AgentExecuteResult,
  AgentPrompt,
  AgentPromptChoice,
  AutocompleteRequest,
  AutocompleteResult,
  AutocompleteSuggestion,
  AgentHistoryEntry,
  AgentStatus,
} from './types';
