/**
 * Main Agent — Manifest
 * The orchestrator agent that delegates to specialized agents
 */

import { AgentManifest } from '../types';
import { agentRegistry } from '../registry';

const mainManifest: AgentManifest = {
  id: 'main',
  name: 'Main Agent',
  description: 'Central orchestrator that plans, decides, and delegates tasks to specialized agents. Your AI chief of staff.',
  version: '1.0.0',
  status: 'active',
  icon: '🧠',
  category: 'core',
  capabilities: [
    'Plan multi-step workflows',
    'Delegate tasks to specialized agents',
    'Track delegated task status',
    'Make strategic decisions',
    'View cross-agent history',
  ],
  commands: [
    {
      name: '/plan',
      description: 'Create or review a strategic plan',
      interactive: true,
      requiresArgs: true,
    },
    {
      name: '/decide',
      description: 'Get AI-assisted decision support',
      interactive: true,
      requiresArgs: true,
    },
    {
      name: '/delegate',
      description: 'Delegate a task to a specialized agent',
      interactive: true,
    },
    {
      name: '/status',
      description: 'View status of all agents and delegated tasks',
    },
    {
      name: '/history',
      description: 'View cross-agent command history',
      aliases: ['/h'],
    },
    {
      name: '/back',
      description: 'Return to root prompt',
      aliases: ['/b'],
    },
  ],
};

agentRegistry.register(mainManifest);

export default mainManifest;
