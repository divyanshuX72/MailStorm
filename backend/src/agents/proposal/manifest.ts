/**
 * Proposal Agent — Manifest
 * Business proposal creation and management agent
 */

import { AgentManifest } from '../types';
import { agentRegistry } from '../registry';

const proposalManifest: AgentManifest = {
  id: 'proposal',
  name: 'Proposal Agent',
  description: 'Create, edit, and send professional business proposals. Use templates and export to PDF.',
  version: '0.1.0',
  status: 'coming_soon',
  icon: '📄',
  category: 'sales',
  capabilities: [
    'Create proposals from templates',
    'Edit existing proposals',
    'Manage proposal templates',
    'Export to PDF',
    'Send proposals to clients',
  ],
  commands: [
    {
      name: '/create',
      description: 'Create a new proposal',
      interactive: true,
      requiresArgs: true,
    },
    {
      name: '/edit',
      description: 'Edit an existing proposal',
      interactive: true,
      requiresArgs: true,
    },
    {
      name: '/template',
      description: 'Manage proposal templates',
      interactive: true,
    },
    {
      name: '/export',
      description: 'Export proposal to PDF',
      interactive: true,
      requiresArgs: true,
    },
    {
      name: '/send',
      description: 'Send proposal to a client',
      interactive: true,
    },
    {
      name: '/back',
      description: 'Return to root prompt',
      aliases: ['/b'],
    },
  ],
};

agentRegistry.register(proposalManifest);

export default proposalManifest;
