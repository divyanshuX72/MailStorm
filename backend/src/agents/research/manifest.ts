/**
 * Research Agent — Manifest
 * Market research and competitive intelligence agent
 */

import { AgentManifest } from '../types';
import { agentRegistry } from '../registry';

const researchManifest: AgentManifest = {
  id: 'research',
  name: 'Research Agent',
  description: 'Conduct market research, competitor analysis, and industry intelligence gathering.',
  version: '0.1.0',
  status: 'coming_soon',
  icon: '🔬',
  category: 'intelligence',
  capabilities: [
    'Company research and profiling',
    'Competitor analysis',
    'Market trend analysis',
    'Industry reports',
    'Export research data',
  ],
  commands: [
    {
      name: '/company',
      description: 'Research a specific company',
      interactive: true,
      requiresArgs: true,
    },
    {
      name: '/competitor',
      description: 'Analyze competitors',
      interactive: true,
      requiresArgs: true,
    },
    {
      name: '/market',
      description: 'Analyze market trends',
      interactive: true,
      requiresArgs: true,
    },
    {
      name: '/industry',
      description: 'Get industry overview and insights',
      interactive: true,
      requiresArgs: true,
    },
    {
      name: '/export',
      description: 'Export research data',
      interactive: true,
    },
    {
      name: '/back',
      description: 'Return to root prompt',
      aliases: ['/b'],
    },
  ],
};

agentRegistry.register(researchManifest);

export default researchManifest;
