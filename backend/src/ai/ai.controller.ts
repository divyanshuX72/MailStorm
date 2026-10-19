/**
 * AI Controller — Request Handler for AI Commands
 * Orchestrates the full pipeline: LLM → Parse → Validate → Execute
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { processCommand } from './openrouter.service';
import { validateCommand, ResolvedSendEmail, ResolvedRunCampaign } from './validation.service';
import { executeSendEmail, executeRunCampaign } from './execution.service';
import { sendSuccess, sendError } from '../utils/helpers';
import logger from '../utils/logger';

class AIController {
  /**
   * POST /api/ai-command
   * Process a natural language command through the AI pipeline
   */
  async executeCommand(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { command } = req.body;

      // 1. Input validation
      if (!command || typeof command !== 'string' || command.trim().length === 0) {
        sendError(res, 'Command is required', 400);
        return;
      }

      const trimmedCommand = command.trim();

      if (trimmedCommand.length > 500) {
        sendError(res, 'Command is too long (max 500 characters)', 400);
        return;
      }

      logger.info(`AI command received from user ${userId}: "${trimmedCommand}"`);

      // 2. Send to LLM and parse response
      const parseResult = await processCommand(userId, trimmedCommand);

      if (!parseResult.success || !parseResult.command) {
        sendSuccess(res, {
          status: 'error',
          stage: 'parsing',
          parsedCommand: null,
          validation: null,
          execution: null,
          error: parseResult.error || 'Unable to understand command. Please try rephrasing.',
        }, 'AI could not understand the command');
        return;
      }

      // 3. Validate against database
      const validationResult = await validateCommand(userId, parseResult.command);

      if (!validationResult.valid) {
        sendSuccess(res, {
          status: 'error',
          stage: 'validation',
          parsedCommand: parseResult.command,
          validation: {
            valid: false,
            errors: validationResult.errors,
          },
          execution: null,
          error: validationResult.errors.join('. '),
        }, 'Validation failed');
        return;
      }

      // 4. Execute command
      let executionResult;

      if (validationResult.resolved!.action === 'send_email') {
        executionResult = await executeSendEmail(
          userId,
          validationResult.resolved as ResolvedSendEmail
        );
      } else if (validationResult.resolved!.action === 'run_campaign') {
        executionResult = await executeRunCampaign(
          userId,
          validationResult.resolved as ResolvedRunCampaign
        );
      } else {
        sendError(res, 'Unknown resolved action', 500);
        return;
      }

      // 5. Return result
      sendSuccess(res, {
        status: executionResult.success ? 'success' : 'error',
        stage: executionResult.success ? 'completed' : 'execution',
        parsedCommand: parseResult.command,
        validation: {
          valid: true,
          resolved: validationResult.resolved,
        },
        execution: executionResult,
        error: executionResult.success ? null : executionResult.error,
      }, executionResult.success ? 'Command executed successfully' : 'Execution failed');
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();
