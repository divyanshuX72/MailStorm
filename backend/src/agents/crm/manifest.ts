/**
 * CRM Agent — Manifest
 * Customer relationship management agent
 */

import { AgentManifest } from '../types';
import { agentRegistry } from '../registry';

const crmManifest: AgentManifest = {
  id: 'crm',
  name: 'CRM Agent',
  description: 'Manage customer relationships, sales pipeline, follow-ups, and business opportunities.',
  version: '0.1.0',
  status: 'coming_soon',
  icon: '🤝',
  category: 'sales',
  capabilities: [
    'Manage customer records',
    'Track sales pipeline',
    'Schedule follow-ups',
    'Manage opportunities',
    'Customer analytics',
  ],
  commands: [
    {
      name: '/customers',
      description: 'List and search customers',
      interactive: true,
    },
    {
      name: '/pipeline',
      description: 'View and manage sales pipeline',
      interactive: true,
    },
    {
      name: '/followup',
      description: 'Schedule and manage follow-ups',
      interactive: true,
    },
    {
      name: '/opportunities',
      description: 'Track business opportunities',
      interactive: true,
    },
    {
      name: '/back',
      description: 'Return to root prompt',
      aliases: ['/b'],
    },
  ],
};

agentRegistry.register(crmManifest);

export default crmManifest;
