/**
 * Agent Router — Dynamic Route Mounting
 * Provides the top-level /api/agents/* endpoints:
 *   GET  /api/agents              — List all agents
 *   GET  /api/agents/:agentId     — Get agent details
 * 
 * Per-agent sub-routes are mounted dynamically from each agent's routes file.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { agentRegistry } from './index';
import { authenticate } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/helpers';
import logger from '../utils/logger';

// Import per-agent route modules
import emailRoutes from './email/routes';
import mainRoutes from './main/routes';
import { stubRoutes } from './stub/routes';

const router = Router();

// ============================================
// ALL AGENT ROUTES REQUIRE AUTHENTICATION
// ============================================
router.use(authenticate);

// ============================================
// AGENT DISCOVERY ENDPOINTS
// ============================================

/**
 * GET /api/agents
 * List all registered agents with their metadata
 */
router.get('/', (_req: Request, res: Response) => {
  const agents = agentRegistry.list().map((agent) => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    version: agent.version,
    status: agent.status,
    icon: agent.icon,
    category: agent.category,
    commandCount: agent.commands.length,
    capabilities: agent.capabilities,
  }));

  sendSuccess(res, {
    agents,
    total: agents.length,
    active: agents.filter((a) => a.status === 'active').length,
    comingSoon: agents.filter((a) => a.status === 'coming_soon').length,
  }, `${agents.length} agents registered`);
});

/**
 * GET /api/agents/:agentId
 * Get detailed information about a specific agent
 */
router.get('/:agentId', (req: Request, res: Response) => {
  const agentId = req.params.agentId as string;
  const agent = agentRegistry.get(agentId);

  if (!agent) {
    sendError(res, `Agent "${agentId}" not found. Available: ${agentRegistry.ids().join(', ')}`, 404);
    return;
  }

  sendSuccess(res, agent, `Agent: ${agent.name}`);
});

// ============================================
// PER-AGENT SUB-ROUTES
// ============================================

// Active agents — full route modules
router.use('/email', emailRoutes);
router.use('/main', mainRoutes);

// Stub agents — generic "coming_soon" handlers
router.use('/lead', stubRoutes('lead'));
router.use('/crm', stubRoutes('crm'));
router.use('/proposal', stubRoutes('proposal'));
router.use('/research', stubRoutes('research'));
router.use('/meeting', stubRoutes('meeting'));
router.use('/analytics', stubRoutes('analytics'));

// ============================================
// CATCH-ALL FOR UNKNOWN AGENTS
// ============================================

router.all('/:agentId/*', (req: Request, res: Response) => {
  const agentId = req.params.agentId as string;
  if (!agentRegistry.has(agentId)) {
    sendError(res, `Agent "${agentId}" not found. Available: ${agentRegistry.ids().join(', ')}`, 404);
  } else {
    sendError(res, `Endpoint not found for agent "${agentId}"`, 404);
  }
});

export default router;
