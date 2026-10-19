/**
 * Analytics Agent — Manifest
 * Business analytics and reporting agent
 */

import { AgentManifest } from '../types';
import { agentRegistry } from '../registry';

const analyticsManifest: AgentManifest = {
  id: 'analytics',
  name: 'Analytics Agent',
  description: 'View dashboards, generate reports, export data, and analyze business trends.',
  version: '0.1.0',
  status: 'coming_soon',
  icon: '📊',
  category: 'intelligence',
  capabilities: [
    'View business dashboards',
    'Generate custom reports',
    'Export analytics data',
    'Analyze trends over time',
    'Cross-agent analytics',
  ],
  commands: [
    {
      name: '/dashboard',
      description: 'View analytics dashboard',
    },
    {
      name: '/reports',
      description: 'Generate and view reports',
      interactive: true,
    },
    {
      name: '/export',
      description: 'Export analytics data to CSV/PDF',
      interactive: true,
    },
    {
      name: '/trends',
      description: 'Analyze trends over time',
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

agentRegistry.register(analyticsManifest);

export default analyticsManifest;
