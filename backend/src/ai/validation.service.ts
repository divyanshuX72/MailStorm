/**
 * Validation Service — Database Validation for AI Commands
 * Validates AI-parsed commands against real database records
 * Uses fuzzy matching (case-insensitive contains) to find the closest match
 */

import prisma from '../config/database';
import { AICommand, SendEmailCommand, RunCampaignCommand, ReplyCommand } from './command.parser';
import logger from '../utils/logger';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  resolved?: ResolvedSendEmail | ResolvedRunCampaign | ReplyCommand;
}

export interface ResolvedSendEmail {
  action: 'send_email';
  groupName: string;
  templateId: string;
  templateName: string;
  smtpAccountId: string;
  smtpName: string;
  contactCount: number;
}

export interface ResolvedRunCampaign {
  action: 'run_campaign';
  campaignId: string;
  campaignName: string;
  campaignStatus: string;
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate an AI command against the database.
 * Returns resolved IDs if valid, or specific error messages.
 */
export async function validateCommand(
  userId: string,
  command: AICommand
): Promise<ValidationResult> {
  if (command.action === 'send_email') {
    return validateSendEmail(userId, command);
  }

  if (command.action === 'run_campaign') {
    return validateRunCampaign(userId, command);
  }

  if (command.action === 'reply') {
    return {
      valid: true,
      errors: [],
      resolved: command as any,
    };
  }

  return { valid: false, errors: [`Unsupported action: "${(command as any).action}"`] };
}

/**
 * Validate send_email command:
 * - Find matching contact group
 * - Find matching template
 * - Find matching SMTP account
 */
async function validateSendEmail(
  userId: string,
  command: SendEmailCommand
): Promise<ValidationResult> {
  const errors: string[] = [];

  // 1. Find contact group (case-insensitive fuzzy match)
  const groupContacts = await prisma.contact.findMany({
    where: {
      userId,
      groupName: { contains: command.group },
      status: 'ACTIVE',
      isSubscribed: true,
    },
    select: { groupName: true },
  });

  const uniqueGroups = [...new Set(groupContacts.map((c) => c.groupName).filter(Boolean))];
  let matchedGroup: string | null = null;
  let contactCount = 0;

  if (uniqueGroups.length === 0) {
    errors.push(`Group not found: "${command.group}"`);
  } else {
    // Prefer exact match, then first fuzzy match
    matchedGroup =
      uniqueGroups.find((g) => g!.toLowerCase() === command.group.toLowerCase()) ||
      uniqueGroups[0]!;

    // Count contacts in the matched group
    contactCount = await prisma.contact.count({
      where: {
        userId,
        groupName: matchedGroup,
        status: 'ACTIVE',
        isSubscribed: true,
      },
    });

    if (contactCount === 0) {
      errors.push(`Group "${matchedGroup}" has no active contacts`);
    }
  }

  // 2. Find template (case-insensitive fuzzy match)
  const templates = await prisma.template.findMany({
    where: {
      userId,
      isActive: true,
      name: { contains: command.template },
    },
    select: { id: true, name: true },
  });

  let matchedTemplate: { id: string; name: string } | null = null;

  if (templates.length === 0) {
    errors.push(`Template not found: "${command.template}"`);
  } else {
    matchedTemplate =
      templates.find((t) => t.name.toLowerCase() === command.template.toLowerCase()) ||
      templates[0];
  }

  // 3. Find SMTP account (case-insensitive fuzzy match)
  const smtpAccounts = await prisma.smtpAccount.findMany({
    where: {
      userId,
      isEnabled: true,
      name: { contains: command.smtp },
    },
    select: { id: true, name: true },
  });

  let matchedSmtp: { id: string; name: string } | null = null;

  if (smtpAccounts.length === 0) {
    errors.push(`SMTP account not found: "${command.smtp}"`);
  } else {
    matchedSmtp =
      smtpAccounts.find((s) => s.name.toLowerCase() === command.smtp.toLowerCase()) ||
      smtpAccounts[0];
  }

  // Return result
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  logger.info(`AI command validated: send_email to group="${matchedGroup}" template="${matchedTemplate!.name}" smtp="${matchedSmtp!.name}"`);

  return {
    valid: true,
    errors: [],
    resolved: {
      action: 'send_email',
      groupName: matchedGroup!,
      templateId: matchedTemplate!.id,
      templateName: matchedTemplate!.name,
      smtpAccountId: matchedSmtp!.id,
      smtpName: matchedSmtp!.name,
      contactCount,
    },
  };
}

/**
 * Validate run_campaign command:
 * - Find matching campaign by name
 * - Verify it's in a startable status
 */
async function validateRunCampaign(
  userId: string,
  command: RunCampaignCommand
): Promise<ValidationResult> {
  const errors: string[] = [];

  // Find campaign by name (case-insensitive fuzzy match)
  const campaigns = await prisma.campaign.findMany({
    where: {
      userId,
      name: { contains: command.campaign },
    },
    select: { id: true, name: true, status: true },
  });

  if (campaigns.length === 0) {
    errors.push(`Campaign not found: "${command.campaign}"`);
    return { valid: false, errors };
  }

  // Prefer exact match, then first fuzzy match
  const matched =
    campaigns.find((c) => c.name.toLowerCase() === command.campaign.toLowerCase()) ||
    campaigns[0];

  // Check if campaign can be started
  if (!['DRAFT', 'SCHEDULED'].includes(matched.status)) {
    errors.push(
      `Campaign "${matched.name}" cannot be started — current status: ${matched.status}. Only DRAFT or SCHEDULED campaigns can be started.`
    );
    return { valid: false, errors };
  }

  logger.info(`AI command validated: run_campaign "${matched.name}" (${matched.id})`);

  return {
    valid: true,
    errors: [],
    resolved: {
      action: 'run_campaign',
      campaignId: matched.id,
      campaignName: matched.name,
      campaignStatus: matched.status,
    },
  };
}
