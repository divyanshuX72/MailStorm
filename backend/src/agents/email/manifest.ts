/**
 * Email Agent — Manifest
 * Defines metadata, commands, and capabilities for the Email Agent
 */

import { AgentManifest } from '../types';
import { agentRegistry } from '../registry';

const emailManifest: AgentManifest = {
  id: 'email',
  name: 'Email Agent',
  description: 'Manage email campaigns, templates, SMTP accounts, and contact groups. Send targeted emails at scale.',
  version: '1.0.0',
  status: 'active',
  icon: '📧',
  category: 'communication',
  capabilities: [
    'Send email campaigns',
    'Manage email templates',
    'Manage contact groups',
    'Configure SMTP accounts',
    'Track campaign status',
    'View email history',
    'Natural language commands',
  ],
  commands: [
    {
      name: '/template',
      description: 'List and manage email templates',
      aliases: ['/templates', '/t'],
      interactive: true,
    },
    {
      name: '/group',
      description: 'List and manage contact groups',
      aliases: ['/groups', '/g'],
      interactive: true,
    },
    {
      name: '/smtp',
      description: 'List and manage SMTP accounts',
      aliases: ['/s'],
      interactive: true,
    },
    {
      name: '/campaign',
      description: 'List and manage campaigns',
      aliases: ['/campaigns', '/c'],
      interactive: true,
    },
    {
      name: '/send',
      description: 'Send an email campaign (interactive guided flow)',
      interactive: true,
    },
    {
      name: '/history',
      description: 'View recent email operations',
      aliases: ['/h'],
    },
    {
      name: '/status',
      description: 'View email agent status and statistics',
    },
    {
      name: '/back',
      description: 'Return to root prompt',
      aliases: ['/b'],
    },
  ],
};

// Self-register
agentRegistry.register(emailManifest);

export default emailManifest;
