/**
 * Email Agent — Service Layer
 * Delegates to existing backend services. Contains ZERO business logic.
 * This is a pure orchestration layer that bridges the agent API to existing services.
 */

import prisma from '../../config/database';
import { templateRepository } from '../../repositories/template.repository';
import { campaignService } from '../../services/campaign.service';
import { AgentExecuteResult, AutocompleteResult, AgentHistoryEntry } from '../types';
import logger from '../../utils/logger';

class EmailAgentService {
  // ============================================
  // DATA FETCHING (for CLI to display)
  // ============================================

  /**
   * Fetch all templates for a user
   */
  async getTemplates(userId: string) {
    const templates = await prisma.template.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        name: true,
        subject: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
    return templates;
  }

  /**
   * Fetch all contact groups for a user with contact counts
   */
  async getGroups(userId: string) {
    const groups = await prisma.contact.groupBy({
      by: ['groupName'],
      where: {
        userId,
        groupName: { not: null },
        NOT: { groupName: '' },
        status: 'ACTIVE',
        isSubscribed: true,
      },
      _count: { id: true },
    });

    return groups
      .filter((g) => g.groupName)
      .map((g) => ({
        name: g.groupName!,
        contactCount: g._count.id,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Fetch all enabled SMTP accounts for a user
   */
  async getSmtpAccounts(userId: string) {
    const accounts = await prisma.smtpAccount.findMany({
      where: { userId, isEnabled: true },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        fromEmail: true,
        fromName: true,
        provider: true,
        isDefault: true,
        isEnabled: true,
      },
      orderBy: { isDefault: 'desc' },
    });
    return accounts;
  }

  /**
   * Fetch campaigns for a user
   */
  async getCampaigns(userId: string, status?: string) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      select: {
        id: true,
        name: true,
        subject: true,
        status: true,
        totalRecipients: true,
        sent: true,
        failed: true,
        contactGroup: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
        template: { select: { name: true } },
        smtpAccount: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return campaigns;
  }

  /**
   * Get email agent stats
   */
  async getStats(userId: string) {
    const [
      templateCount,
      groupCount,
      smtpCount,
      campaignCount,
      totalSent,
      totalFailed,
    ] = await Promise.all([
      prisma.template.count({ where: { userId, isActive: true } }),
      prisma.contact.groupBy({
        by: ['groupName'],
        where: { userId, groupName: { not: null }, NOT: { groupName: '' } },
      }).then((g) => g.length),
      prisma.smtpAccount.count({ where: { userId, isEnabled: true } }),
      prisma.campaign.count({ where: { userId } }),
      prisma.campaign.aggregate({ where: { userId }, _sum: { sent: true } }),
      prisma.campaign.aggregate({ where: { userId }, _sum: { failed: true } }),
    ]);

    return {
      templates: templateCount,
      groups: groupCount,
      smtpAccounts: smtpCount,
      campaigns: campaignCount,
      totalSent: totalSent._sum.sent || 0,
      totalFailed: totalFailed._sum.failed || 0,
      successRate: (totalSent._sum.sent || 0) > 0
        ? Math.round(((totalSent._sum.sent || 0) / ((totalSent._sum.sent || 0) + (totalFailed._sum.failed || 0))) * 100)
        : 0,
    };
  }

  // ============================================
  // COMMAND EXECUTION
  // ============================================

  /**
   * Execute a send email command with resolved parameters
   */
  async executeSend(
    userId: string,
    params: { templateId: string; groupName: string; smtpAccountId: string }
  ): Promise<AgentExecuteResult> {
    try {
      // Fetch template for subject
      const template = await templateRepository.findById(params.templateId);
      if (!template) {
        return { success: false, message: 'Template not found', error: 'Template not found' };
      }

      // Create campaign via existing service
      const campaign = await campaignService.create(userId, {
        name: `CLI: ${template.name} → ${params.groupName}`,
        subject: template.subject,
        smtpAccountId: params.smtpAccountId,
        templateId: params.templateId,
        contactGroup: params.groupName,
      });

      // Start campaign
      await campaignService.start(campaign.id, userId);

      logger.info(`Email Agent: Campaign created and started — ${campaign.id}`);

      return {
        success: true,
        message: `Campaign "${campaign.name}" created and started successfully`,
        data: {
          campaignId: campaign.id,
          campaignName: campaign.name,
          templateName: template.name,
          groupName: params.groupName,
        },
        meta: {
          agentId: 'email',
          action: 'send',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      logger.error('Email Agent: Send failed', { error: error.message });
      return {
        success: false,
        message: 'Failed to send email campaign',
        error: error.message,
      };
    }
  }

  /**
   * Execute a run campaign command
   */
  async executeRunCampaign(
    userId: string,
    campaignId: string
  ): Promise<AgentExecuteResult> {
    try {
      await campaignService.start(campaignId, userId);

      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { name: true, totalRecipients: true },
      });

      return {
        success: true,
        message: `Campaign "${campaign?.name}" started successfully`,
        data: { campaignId, campaignName: campaign?.name },
        meta: {
          agentId: 'email',
          action: 'run_campaign',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      logger.error('Email Agent: Run campaign failed', { error: error.message });
      return {
        success: false,
        message: 'Failed to start campaign',
        error: error.message,
      };
    }
  }

  // ============================================
  // AUTOCOMPLETE
  // ============================================

  /**
   * Get autocomplete suggestions for the email agent
   */
  async getAutocomplete(
    userId: string,
    partial: string,
    context?: string
  ): Promise<AutocompleteResult> {
    const lower = partial.toLowerCase();
    const suggestions: AutocompleteResult['suggestions'] = [];

    // Get data based on context
    if (!context || context === 'template') {
      const templates = await this.getTemplates(userId);
      templates
        .filter((t) => t.name.toLowerCase().includes(lower))
        .forEach((t) => {
          suggestions.push({
            value: t.id,
            label: t.name,
            description: t.subject,
            category: 'template',
          });
        });
    }

    if (!context || context === 'group') {
      const groups = await this.getGroups(userId);
      groups
        .filter((g) => g.name.toLowerCase().includes(lower))
        .forEach((g) => {
          suggestions.push({
            value: g.name,
            label: g.name,
            description: `${g.contactCount} contacts`,
            category: 'group',
          });
        });
    }

    if (!context || context === 'smtp') {
      const smtpAccounts = await this.getSmtpAccounts(userId);
      smtpAccounts
        .filter((s) => s.name.toLowerCase().includes(lower))
        .forEach((s) => {
          suggestions.push({
            value: s.id,
            label: s.name,
            description: `${s.host}:${s.port}`,
            category: 'smtp',
          });
        });
    }

    if (!context || context === 'campaign') {
      const campaigns = await this.getCampaigns(userId);
      campaigns
        .filter((c) => c.name.toLowerCase().includes(lower))
        .forEach((c) => {
          suggestions.push({
            value: c.id,
            label: c.name,
            description: `Status: ${c.status}`,
            category: 'campaign',
          });
        });
    }

    return { suggestions };
  }

  // ============================================
  // HISTORY
  // ============================================

  /**
   * Get recent campaign activity as history entries
   */
  async getHistory(userId: string, limit: number = 10): Promise<AgentHistoryEntry[]> {
    const campaigns = await prisma.campaign.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        status: true,
        sent: true,
        failed: true,
        totalRecipients: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return campaigns.map((c) => ({
      id: c.id,
      agentId: 'email',
      command: `Campaign: ${c.name}`,
      action: 'campaign',
      result: c.status === 'COMPLETED' ? 'success' as const
        : c.status === 'FAILED' ? 'error' as const
        : 'pending' as const,
      message: `${c.sent}/${c.totalRecipients} sent, ${c.failed} failed — ${c.status}`,
      timestamp: (c.startedAt || c.createdAt).toISOString(),
    }));
  }
}

export const emailAgentService = new EmailAgentService();
