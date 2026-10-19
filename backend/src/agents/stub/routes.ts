/**
 * Stub Agent Routes — Generic "Coming Soon" Handlers
 * Used for agents that are registered but don't have full implementations yet.
 * Returns structured responses so the CLI can display proper messaging.
 */

import { Router, Request, Response } from 'express';
import { agentRegistry } from '../registry';
import { sendSuccess } from '../../utils/helpers';

/**
 * Create a stub router for a coming_soon agent.
 * All endpoints return structured "coming soon" responses.
 */
export function stubRoutes(agentId: string): Router {
  const router = Router();

  // GET /api/agents/:agentId/status
  router.get('/status', (_req: Request, res: Response) => {
    const agent = agentRegistry.get(agentId);
    sendSuccess(res, {
      agentId,
      name: agent?.name || agentId,
      icon: agent?.icon || '🔧',
      status: 'coming_soon',
      message: `${agent?.name || agentId} is under development and will be available in a future release.`,
      commands: agent?.commands.map((c) => ({
        name: c.name,
        description: c.description,
        status: 'coming_soon',
      })) || [],
    }, `${agent?.name || agentId} — Coming Soon`);
  });

  // GET /api/agents/:agentId/history
  router.get('/history', (_req: Request, res: Response) => {
    sendSuccess(res, {
      history: [],
      count: 0,
      message: 'No history available — agent is under development.',
    }, 'No history');
  });

  // GET /api/agents/:agentId/autocomplete
  router.get('/autocomplete', (_req: Request, res: Response) => {
    const agent = agentRegistry.get(agentId);
    sendSuccess(res, {
      suggestions: (agent?.commands || []).map((c) => ({
        value: c.name,
        label: c.name,
        description: `${c.description} (coming soon)`,
        category: 'command',
      })),
    }, 'Command suggestions');
  });

  // POST /api/agents/:agentId/execute
  router.post('/execute', (_req: Request, res: Response) => {
    const agent = agentRegistry.get(agentId);
    sendSuccess(res, {
      success: false,
      message: `${agent?.name || agentId} is under development. This feature will be available in a future release.`,
      data: {
        agentId,
        status: 'coming_soon',
        availableAgents: agentRegistry.listActive().map((a) => ({
          id: a.id,
          name: a.name,
          icon: a.icon,
        })),
      },
      meta: {
        agentId,
        action: 'execute',
        timestamp: new Date().toISOString(),
      },
    }, `${agent?.name || agentId} — Coming Soon`);
  });

  // Catch-all for any other sub-routes
  router.all('/*', (_req: Request, res: Response) => {
    const agent = agentRegistry.get(agentId);
    sendSuccess(res, {
      agentId,
      status: 'coming_soon',
      message: `${agent?.name || agentId} is under development.`,
    }, 'Coming Soon');
  });

  return router;
}
