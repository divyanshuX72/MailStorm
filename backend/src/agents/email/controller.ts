/**
 * Email Agent — Controller
 * Request handlers for all Email Agent API endpoints
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { emailAgentService } from './service';
import { sendSuccess, sendError } from '../../utils/helpers';
import logger from '../../utils/logger';

class EmailAgentController {
  /**
   * GET /api/agents/email/templates
   * List all active templates
   */
  async getTemplates(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const templates = await emailAgentService.getTemplates(userId);
      sendSuccess(res, { templates, count: templates.length }, 'Templates loaded');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/agents/email/groups
   * List all contact groups with counts
   */
  async getGroups(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const groups = await emailAgentService.getGroups(userId);
      sendSuccess(res, { groups, count: groups.length }, 'Contact groups loaded');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/agents/email/smtp
   * List all enabled SMTP accounts
   */
  async getSmtp(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const smtpAccounts = await emailAgentService.getSmtpAccounts(userId);
      sendSuccess(res, { smtpAccounts, count: smtpAccounts.length }, 'SMTP accounts loaded');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/agents/email/campaigns
   * List campaigns (optionally filter by status)
   */
  async getCampaigns(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const status = req.query.status as string | undefined;
      const campaigns = await emailAgentService.getCampaigns(userId, status);
      sendSuccess(res, { campaigns, count: campaigns.length }, 'Campaigns loaded');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/agents/email/status
   * Get email agent status and statistics
   */
  async getStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const stats = await emailAgentService.getStats(userId);
      sendSuccess(res, {
        agentId: 'email',
        name: 'Email Agent',
        status: 'active',
        stats,
      }, 'Email agent status');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/agents/email/history
   * Get recent email operations
   */
  async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 10;
      const history = await emailAgentService.getHistory(userId, limit);
      sendSuccess(res, { history, count: history.length }, 'Email history loaded');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/agents/email/autocomplete
   * Get autocomplete suggestions
   */
  async getAutocomplete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const partial = (req.query.q as string) || '';
      const context = req.query.context as string | undefined;
      const result = await emailAgentService.getAutocomplete(userId, partial, context);
      sendSuccess(res, result, 'Autocomplete suggestions');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/agents/email/execute
   * Execute an email agent command
   * 
   * Body can contain:
   * - { command: "natural language text" } → sends to AI parser
   * - { action: "send", params: { templateId, groupName, smtpAccountId } } → direct execution
   * - { action: "run_campaign", params: { campaignId } } → starts a campaign
   */
  async execute(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { command, action, params } = req.body;

      // Direct execution with structured params
      if (action === 'send' && params?.templateId && params?.groupName && params?.smtpAccountId) {
        const result = await emailAgentService.executeSend(userId, {
          templateId: params.templateId,
          groupName: params.groupName,
          smtpAccountId: params.smtpAccountId,
        });
        sendSuccess(res, result, result.message);
        return;
      }

      if (action === 'run_campaign' && params?.campaignId) {
        const result = await emailAgentService.executeRunCampaign(userId, params.campaignId);
        sendSuccess(res, result, result.message);
        return;
      }

      // Natural language command → delegate to existing AI pipeline
      if (command && typeof command === 'string') {
        // Import the existing AI pipeline
        const { processCommand } = await import('../../ai/openrouter.service');
        const { validateCommand } = await import('../../ai/validation.service');
        const { executeSendEmail, executeRunCampaign } = await import('../../ai/execution.service');

        const parseResult = await processCommand(userId, command);

        if (!parseResult.success || !parseResult.command) {
          sendSuccess(res, {
            success: false,
            message: parseResult.error || 'Unable to understand command',
            stage: 'parsing',
          }, 'Command not understood');
          return;
        }

        const validationResult = await validateCommand(userId, parseResult.command);

        if (!validationResult.valid) {
          sendSuccess(res, {
            success: false,
            message: validationResult.errors.join('. '),
            stage: 'validation',
            parsedCommand: parseResult.command,
          }, 'Validation failed');
          return;
        }

        // Execute
        let executionResult;
        if (validationResult.resolved!.action === 'send_email') {
          executionResult = await executeSendEmail(
            userId,
            validationResult.resolved as any
          );
        } else if (validationResult.resolved!.action === 'run_campaign') {
          executionResult = await executeRunCampaign(
            userId,
            validationResult.resolved as any
          );
        } else if (validationResult.resolved!.action === 'reply') {
          executionResult = {
            success: true,
            message: (validationResult.resolved as any).message,
          };
        } else {
          sendError(res, 'Unknown action', 400);
          return;
        }

        sendSuccess(res, {
          success: executionResult.success,
          message: executionResult.message,
          data: executionResult,
          meta: {
            agentId: 'email',
            action: validationResult.resolved!.action,
            timestamp: new Date().toISOString(),
          },
        }, executionResult.message);
        return;
      }

      sendError(res, 'Invalid request. Provide either { command: "..." } or { action: "...", params: { ... } }', 400);
    } catch (error) {
      next(error);
    }
  }
}

export const emailAgentController = new EmailAgentController();
