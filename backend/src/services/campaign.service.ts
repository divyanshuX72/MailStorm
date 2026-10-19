/**
 * Campaign Service — Business Logic
 * Manages campaign lifecycle: create, start, pause, resume, cancel
 */

import { campaignRepository } from '../repositories/campaign.repository';
import { contactRepository } from '../repositories/contact.repository';
import { smtpRepository } from '../repositories/smtp.repository';
import { templateRepository } from '../repositories/template.repository';
import { queueService } from './queue.service';
import { AppError } from '../utils/helpers';
import { parsePagination, createPaginationMeta, parseSort } from '../utils/pagination';
import { CampaignInput, PaginatedResponse } from '../types';
import { Campaign, Prisma } from '@prisma/client';
import prisma from '../config/database';
import logger from '../utils/logger';

class CampaignService {
  /**
   * Create a new campaign
   */
  async create(userId: string, input: CampaignInput): Promise<Campaign> {
    // Verify SMTP account exists and belongs to user
    const smtp = await smtpRepository.findById(input.smtpAccountId);
    if (!smtp || smtp.userId !== userId) {
      throw new AppError('SMTP account not found', 404);
    }

    // Verify template exists and belongs to user
    const template = await templateRepository.findById(input.templateId);
    if (!template || template.userId !== userId) {
      throw new AppError('Template not found', 404);
    }

    // Get contacts for the campaign
    let contacts;
    if (input.contactIds && input.contactIds.length > 0) {
      contacts = await contactRepository.findByIds(input.contactIds, userId);
    } else if (input.contactGroup) {
      contacts = await contactRepository.findByGroup(userId, input.contactGroup);
    } else {
      throw new AppError('Either contactGroup or contactIds must be provided', 400);
    }

    if (contacts.length === 0) {
      throw new AppError('No active contacts found for this campaign', 400);
    }

    // Determine status based on scheduling
    const status = input.scheduledAt ? 'SCHEDULED' : 'DRAFT';

    // Create campaign
    const campaign = await campaignRepository.create({
      name: input.name,
      subject: input.subject,
      status,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      totalRecipients: contacts.length,
      batchSize: input.batchSize || 50,
      delayMs: input.delayMs || 1000,
      retryAttempts: input.retryAttempts || 3,
      contactGroup: input.contactGroup,
      user: { connect: { id: userId } },
      smtpAccount: { connect: { id: input.smtpAccountId } },
      template: { connect: { id: input.templateId } },
    });

    // Create recipient records
    const recipientData = contacts.map((contact) => ({
      campaignId: campaign.id,
      contactId: contact.id,
    }));

    await campaignRepository.addRecipients(recipientData);

    await this.logActivity(userId, 'CREATE', campaign.id);
    logger.info(`Campaign created: ${campaign.name} with ${contacts.length} recipients`);

    return campaign;
  }

  /**
   * Get all campaigns with pagination
   */
  async getAll(userId: string, query: any): Promise<PaginatedResponse<Campaign>> {
    const { page, limit, skip } = parsePagination(query);
    const { field, order } = parseSort(query.sortBy, query.sortOrder, [
      'name', 'status', 'totalRecipients', 'sent', 'createdAt', 'scheduledAt',
    ]);

    const where: Prisma.CampaignWhereInput = { userId };
    if (query.search) {
      where.OR = [{ name: { contains: query.search } }, { subject: { contains: query.search } }];
    }
    if (query.status) where.status = query.status;

    const { campaigns, total } = await campaignRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [field]: order },
    });

    return {
      data: campaigns,
      pagination: createPaginationMeta(total, page, limit),
    };
  }

  /**
   * Get a single campaign with details
   */
  async getById(id: string, userId: string): Promise<Campaign> {
    const campaign = await campaignRepository.findById(id);
    if (!campaign || campaign.userId !== userId) {
      throw new AppError('Campaign not found', 404);
    }
    return campaign;
  }

  /**
   * Start a campaign immediately
   */
  async start(id: string, userId: string): Promise<void> {
    const campaign = await campaignRepository.findById(id);
    if (!campaign || campaign.userId !== userId) {
      throw new AppError('Campaign not found', 404);
    }

    if (!['DRAFT', 'SCHEDULED'].includes(campaign.status)) {
      throw new AppError(`Campaign cannot be started from status: ${campaign.status}`, 400);
    }

    await queueService.startCampaign(id);
    await this.logActivity(userId, 'SEND', id);
  }

  /**
   * Pause a running campaign
   */
  async pause(id: string, userId: string): Promise<void> {
    const campaign = await campaignRepository.findById(id);
    if (!campaign || campaign.userId !== userId) {
      throw new AppError('Campaign not found', 404);
    }

    if (campaign.status !== 'RUNNING') {
      throw new AppError('Only running campaigns can be paused', 400);
    }

    await queueService.pauseCampaign(id);
    await this.logActivity(userId, 'PAUSE', id);
  }

  /**
   * Resume a paused campaign
   */
  async resume(id: string, userId: string): Promise<void> {
    const campaign = await campaignRepository.findById(id);
    if (!campaign || campaign.userId !== userId) {
      throw new AppError('Campaign not found', 404);
    }

    if (campaign.status !== 'PAUSED') {
      throw new AppError('Only paused campaigns can be resumed', 400);
    }

    await queueService.resumeCampaign(id);
    await this.logActivity(userId, 'RESUME', id);
  }

  /**
   * Cancel a campaign
   */
  async cancel(id: string, userId: string): Promise<void> {
    const campaign = await campaignRepository.findById(id);
    if (!campaign || campaign.userId !== userId) {
      throw new AppError('Campaign not found', 404);
    }

    if (!['RUNNING', 'PAUSED', 'SCHEDULED'].includes(campaign.status)) {
      throw new AppError('Campaign cannot be cancelled in its current status', 400);
    }

    await queueService.cancelCampaign(id);
    await this.logActivity(userId, 'CANCEL', id);
  }

  /**
   * Retry failed emails
   */
  async retryFailed(id: string, userId: string): Promise<void> {
    const campaign = await campaignRepository.findById(id);
    if (!campaign || campaign.userId !== userId) {
      throw new AppError('Campaign not found', 404);
    }

    await queueService.retryFailed(id);
    await this.logActivity(userId, 'SEND', id);
  }

  /**
   * Get campaign progress
   */
  async getProgress(id: string, userId: string) {
    const campaign = await campaignRepository.findById(id);
    if (!campaign || campaign.userId !== userId) {
      throw new AppError('Campaign not found', 404);
    }

    return queueService.getProgress(id);
  }

  /**
   * Get campaign recipients
   */
  async getRecipients(id: string, userId: string, query: any) {
    const campaign = await campaignRepository.findById(id);
    if (!campaign || campaign.userId !== userId) {
      throw new AppError('Campaign not found', 404);
    }

    const { page, limit, skip } = parsePagination(query);
    const { recipients, total } = await campaignRepository.getRecipients(id, {
      skip,
      take: limit,
      status: query.status,
    });

    return {
      data: recipients,
      pagination: createPaginationMeta(total, page, limit),
    };
  }

  /**
   * Delete a campaign (only if DRAFT or CANCELLED)
   */
  async delete(id: string, userId: string): Promise<void> {
    const campaign = await campaignRepository.findById(id);
    if (!campaign || campaign.userId !== userId) {
      throw new AppError('Campaign not found', 404);
    }

    if (!['DRAFT', 'CANCELLED', 'COMPLETED', 'FAILED'].includes(campaign.status)) {
      throw new AppError('Active campaigns cannot be deleted', 400);
    }

    await campaignRepository.delete(id);
    await this.logActivity(userId, 'DELETE', id);
  }

  /**
   * Duplicate a campaign
   */
  async duplicate(id: string, userId: string): Promise<Campaign> {
    const original = await campaignRepository.findById(id);
    if (!original || original.userId !== userId) {
      throw new AppError('Campaign not found', 404);
    }

    const campaign = await campaignRepository.create({
      name: `${original.name} (Copy)`,
      subject: original.subject,
      status: 'DRAFT',
      totalRecipients: 0,
      batchSize: original.batchSize,
      delayMs: original.delayMs,
      retryAttempts: original.retryAttempts,
      contactGroup: original.contactGroup,
      user: { connect: { id: userId } },
      smtpAccount: { connect: { id: original.smtpAccountId } },
      template: { connect: { id: original.templateId } },
    });

    return campaign;
  }

  /**
   * Run a campaign again (duplicate with exact recipients and start)
   */
  async rerun(id: string, userId: string): Promise<Campaign> {
    const original = await campaignRepository.findById(id);
    if (!original || original.userId !== userId) {
      throw new AppError('Campaign not found', 404);
    }

    // 1. Create a new campaign, copying fields
    const campaign = await campaignRepository.create({
      name: `${original.name} (Rerun)`,
      subject: original.subject,
      status: 'DRAFT',
      totalRecipients: original.totalRecipients,
      batchSize: original.batchSize,
      delayMs: original.delayMs,
      retryAttempts: original.retryAttempts,
      contactGroup: original.contactGroup,
      user: { connect: { id: userId } },
      smtpAccount: { connect: { id: original.smtpAccountId } },
      template: { connect: { id: original.templateId } },
    });

    // 2. Fetch all recipients from original campaign
    const originalRecipients = await prisma.campaignRecipient.findMany({
      where: { campaignId: id },
      select: { contactId: true },
    });

    if (originalRecipients.length > 0) {
      // 3. Bulk insert new recipients for the new campaign
      const newRecipients = originalRecipients.map((r) => ({
        campaignId: campaign.id,
        contactId: r.contactId,
        status: 'PENDING' as const,
      }));
      await prisma.campaignRecipient.createMany({ data: newRecipients });
    }

    // 4. Fetch all attachments from original campaign
    const originalAttachments = await prisma.attachment.findMany({
      where: { campaignId: id },
    });

    if (originalAttachments.length > 0) {
      // 5. Bulk insert new attachments
      const newAttachments = originalAttachments.map((a) => ({
        filename: a.filename,
        originalName: a.originalName,
        mimeType: a.mimeType,
        size: a.size,
        path: a.path,
        campaignId: campaign.id,
      }));
      await prisma.attachment.createMany({ data: newAttachments });
    }

    // 6. Start the new campaign via queue
    await queueService.startCampaign(campaign.id);

    // 7. Log activity
    await this.logActivity(userId, 'RERUN', campaign.id);

    return campaign;
  }

  private async logActivity(userId: string, action: string, entityId: string): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: { userId, action, entity: 'Campaign', entityId },
      });
    } catch { /* silent */ }
  }
}

export const campaignService = new CampaignService();
