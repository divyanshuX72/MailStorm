/**
 * Execution Service — AI Command Executor
 * Calls existing backend services to execute validated AI commands.
 * NEVER implements email sending directly — only delegates to existing services.
 */

import { campaignService } from '../services/campaign.service';
import { templateRepository } from '../repositories/template.repository';
import { ResolvedSendEmail, ResolvedRunCampaign } from './validation.service';
import logger from '../utils/logger';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ExecutionResult {
  success: boolean;
  message: string;
  campaignId?: string;
  campaignName?: string;
  error?: string;
}

// ============================================
// EXECUTION
// ============================================

/**
 * Execute a validated send_email command.
 * 1. Creates a new campaign using campaignService.create()
 * 2. Starts the campaign using campaignService.start()
 */
export async function executeSendEmail(
  userId: string,
  resolved: ResolvedSendEmail
): Promise<ExecutionResult> {
  try {
    // Fetch template to get subject line
    const template = await templateRepository.findById(resolved.templateId);
    const subject = template?.subject || `${resolved.templateName}`;

    // Step 1: Create campaign via existing service
    const campaign = await campaignService.create(userId, {
      name: `AI: ${resolved.templateName} → ${resolved.groupName}`,
      subject,
      smtpAccountId: resolved.smtpAccountId,
      templateId: resolved.templateId,
      contactGroup: resolved.groupName,
    });

    logger.info(`AI created campaign: ${campaign.id} — "${campaign.name}"`);

    // Step 2: Start campaign via existing service
    await campaignService.start(campaign.id, userId);

    logger.info(`AI started campaign: ${campaign.id}`);

    return {
      success: true,
      message: `Campaign created and started: "${campaign.name}" — Sending ${resolved.templateName} to ${resolved.contactCount} contacts in ${resolved.groupName} via ${resolved.smtpName}`,
      campaignId: campaign.id,
      campaignName: campaign.name,
    };
  } catch (error: any) {
    logger.error('AI execution failed (send_email)', { error: error.message });
    return {
      success: false,
      message: 'Campaign execution failed',
      error: error.message,
    };
  }
}

/**
 * Execute a validated run_campaign command.
 * Starts an existing campaign using campaignService.start().
 */
export async function executeRunCampaign(
  userId: string,
  resolved: ResolvedRunCampaign
): Promise<ExecutionResult> {
  try {
    await campaignService.start(resolved.campaignId, userId);

    logger.info(`AI started existing campaign: ${resolved.campaignId} — "${resolved.campaignName}"`);

    return {
      success: true,
      message: `Campaign started: "${resolved.campaignName}"`,
      campaignId: resolved.campaignId,
      campaignName: resolved.campaignName,
    };
  } catch (error: any) {
    logger.error('AI execution failed (run_campaign)', { error: error.message });
    return {
      success: false,
      message: 'Campaign execution failed',
      error: error.message,
    };
  }
}
