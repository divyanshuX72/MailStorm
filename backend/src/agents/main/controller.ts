/**
 * Main Agent — Controller
 * Request handlers for the orchestrator agent
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { mainAgentService } from './service';
import { sendSuccess, sendError } from '../../utils/helpers';

class MainAgentController {
  /**
   * GET /api/agents/main/status
   * Get status of all agents
   */
  async getStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const statuses = await mainAgentService.getAllAgentStatuses(userId);
      sendSuccess(res, {
        agentId: 'main',
        name: 'Main Agent',
        status: 'active',
        agents: statuses,
      }, 'All agent statuses');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/agents/main/history
   * Get cross-agent history
   */
  async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 15;
      const history = await mainAgentService.getHistory(userId, limit);
      sendSuccess(res, { history, count: history.length }, 'Cross-agent history');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/agents/main/execute
   * Execute a main agent command
   * 
   * Body:
   * - { action: "plan", params: { description: "..." } }
   * - { action: "delegate", params: { agent: "email", task: "..." } }
   * - { action: "decide", params: { question: "..." } }
   * - { command: "natural language" }
   */
  async execute(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { action, params, command } = req.body;

      if (action === 'plan' && params?.description) {
        const result = await mainAgentService.executePlan(userId, params.description);
        sendSuccess(res, result, result.message);
        return;
      }

      if (action === 'delegate' && params?.agent && params?.task) {
        const result = await mainAgentService.executeDelegate(userId, params.agent, params.task);
        sendSuccess(res, result, result.message);
        return;
      }

      if (action === 'status') {
        const statuses = await mainAgentService.getAllAgentStatuses(userId);
        sendSuccess(res, { agents: statuses }, 'Agent statuses');
        return;
      }

      // Natural language — for now return a structured response
      if (command && typeof command === 'string') {
        sendSuccess(res, {
          success: true,
          message: `Main Agent received: "${command}"`,
          data: {
            interpretation: command,
            suggestedAction: 'delegate',
            note: 'Natural language processing will route to the appropriate agent',
          },
          meta: {
            agentId: 'main',
            action: 'natural_language',
            timestamp: new Date().toISOString(),
          },
        }, 'Command received');
        return;
      }

      sendError(res, 'Invalid request. Provide { action, params } or { command }', 400);
    } catch (error) {
      next(error);
    }
  }
}

export const mainAgentController = new MainAgentController();
