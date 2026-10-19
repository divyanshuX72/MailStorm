/**
 * Meeting Agent — Manifest
 * Meeting scheduling and management agent
 */

import { AgentManifest } from '../types';
import { agentRegistry } from '../registry';

const meetingManifest: AgentManifest = {
  id: 'meeting',
  name: 'Meeting Agent',
  description: 'Schedule meetings, manage calendars, track meeting notes, and send invitations.',
  version: '0.1.0',
  status: 'coming_soon',
  icon: '📅',
  category: 'operations',
  capabilities: [
    'Schedule meetings',
    'List upcoming meetings',
    'Cancel meetings',
    'Manage meeting notes',
    'Send meeting invitations',
  ],
  commands: [
    {
      name: '/schedule',
      description: 'Schedule a new meeting',
      interactive: true,
    },
    {
      name: '/list',
      description: 'List upcoming meetings',
    },
    {
      name: '/cancel',
      description: 'Cancel a scheduled meeting',
      interactive: true,
      requiresArgs: true,
    },
    {
      name: '/notes',
      description: 'View or add meeting notes',
      interactive: true,
      requiresArgs: true,
    },
    {
      name: '/back',
      description: 'Return to root prompt',
      aliases: ['/b'],
    },
  ],
};

agentRegistry.register(meetingManifest);

export default meetingManifest;
