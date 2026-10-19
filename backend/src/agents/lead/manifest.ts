/**
 * Lead Agent — Manifest
 * Lead generation and prospecting agent
 */

import { AgentManifest } from '../types';
import { agentRegistry } from '../registry';

const leadManifest: AgentManifest = {
  id: 'lead',
  name: 'Lead Agent',
  description: 'Find and qualify business leads. Search companies, filter prospects, and export lead lists.',
  version: '0.1.0',
  status: 'coming_soon',
  icon: '🎯',
  category: 'sales',
  capabilities: [
    'Search for companies',
    'Filter leads by criteria',
    'Export lead lists',
    'View lead history',
    'Company research',
  ],
  commands: [
    {
      name: '/search',
      description: 'Search for leads by keyword, industry, or location',
      interactive: true,
      requiresArgs: true,
    },
    {
      name: '/company',
      description: 'Look up detailed company information',
      interactive: true,
      requiresArgs: true,
    },
    {
      name: '/filter',
      description: 'Filter leads by criteria (size, revenue, location)',
      interactive: true,
    },
    {
      name: '/export',
      description: 'Export filtered leads to CSV/Excel',
      interactive: true,
    },
    {
      name: '/history',
      description: 'View recent lead searches',
      aliases: ['/h'],
    },
    {
      name: '/back',
      description: 'Return to root prompt',
      aliases: ['/b'],
    },
  ],
};

agentRegistry.register(leadManifest);

export default leadManifest;
