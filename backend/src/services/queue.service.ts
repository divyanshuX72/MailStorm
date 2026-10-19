/**
 * Queue Service — Campaign Email Queue
 * In-memory queue with concurrency control and rate limiting
 */

import { emailService } from './email.service';
import { campaignRepository } from '../repositories/campaign.repository';
import { smtpRepository } from '../repositories/smtp.repository';
import { delay } from '../utils/helpers';
import logger from '../utils/logger';
import prisma from '../config/database';
import { Campaign, SmtpAccount, Template, Contact, CampaignRecipient } from '@prisma/client';

interface QueuedCampaign {
  campaignId: string;
  isPaused: boolean;
  isCancelled: boolean;
}

class QueueService {
  private activeCampaigns: Map<string, QueuedCampaign> = new Map();

  /**
   * Start processing a campaign
   */
  async startCampaign(campaignId: string): Promise<void> {
    // Get campaign with relations
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        smtpAccount: true,
        template: true,
        attachments: true,
      },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED' && campaign.status !== 'PAUSED') {
      throw new Error(`Campaign cannot be started from status: ${campaign.status}`);
    }

    // Register campaign in queue
    this.activeCampaigns.set(campaignId, {
      campaignId,
      isPaused: false,
      isCancelled: false,
    });

    // Update campaign status
    await campaignRepository.update(campaignId, {
      status: 'RUNNING',
      startedAt: campaign.startedAt || new Date(),
    });

    // Process in background
    this.processCampaign(campaign as any).catch((error) => {
      logger.error(`Campaign processing error: ${campaignId}`, { error: error.message });
    });
  }

  /**
   * Pause a running campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    const queued = this.activeCampaigns.get(campaignId);
    if (queued) {
      queued.isPaused = true;
    }
    await campaignRepository.update(campaignId, { status: 'PAUSED' });
    logger.info(`Campaign paused: ${campaignId}`);
  }

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(campaignId: string): Promise<void> {
    const queued = this.activeCampaigns.get(campaignId);
    if (queued) {
      queued.isPaused = false;
      queued.isCancelled = false;
    }
    await this.startCampaign(campaignId);
  }

  /**
   * Cancel a campaign
   */
  async cancelCampaign(campaignId: string): Promise<void> {
    const queued = this.activeCampaigns.get(campaignId);
    if (queued) {
      queued.isCancelled = true;
    }
    await campaignRepository.update(campaignId, { status: 'CANCELLED' });
    this.activeCampaigns.delete(campaignId);
    logger.info(`Campaign cancelled: ${campaignId}`);
  }

  /**
   * Retry failed emails for a campaign
   */
  async retryFailed(campaignId: string): Promise<void> {
    // Reset failed recipients to PENDING
    await prisma.campaignRecipient.updateMany({
      where: {
        campaignId,
        status: 'FAILED',
        retryCount: { lt: 3 },
      },
      data: { status: 'PENDING' },
    });

    // Restart campaign
    await this.startCampaign(campaignId);
  }

  /**
   * Get campaign progress
   */
  async getProgress(campaignId: string) {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) return null;

    return {
      campaignId: campaign.id,
      status: campaign.status,
      total: campaign.totalRecipients,
      sent: campaign.sent,
      failed: campaign.failed,
      percentage: campaign.totalRecipients > 0
        ? Math.round((campaign.sent / campaign.totalRecipients) * 100)
        : 0,
      isActive: this.activeCampaigns.has(campaignId),
    };
  }

  /**
   * Process campaign — send emails in batches
   */
  private async processCampaign(campaign: Campaign & {
    smtpAccount: SmtpAccount;
    template: Template;
    attachments: Array<{ filename: string; originalName: string; path: string }>;
  }): Promise<void> {
    const batchSize = campaign.batchSize || 50;
    const delayMs = campaign.delayMs || 1000;

    logger.info(`Processing campaign: ${campaign.name} (batch: ${batchSize}, delay: ${delayMs}ms)`);

    // Prepare attachments
    const attachments = campaign.attachments.map((a) => ({
      filename: a.originalName,
      path: a.path,
    }));

    try {
      while (true) {
        const queued = this.activeCampaigns.get(campaign.id);

        // Check if cancelled
        if (!queued || queued.isCancelled) {
          logger.info(`Campaign cancelled: ${campaign.id}`);
          break;
        }

        // Check if paused
        if (queued.isPaused) {
          await delay(1000);
          continue;
        }

        // Get next batch of pending recipients
        const pendingRecipients = await campaignRepository.getPendingRecipients(
          campaign.id,
          batchSize
        ) as (CampaignRecipient & { contact: Contact })[];

        // If no more pending recipients, campaign is complete
        if (pendingRecipients.length === 0) {
          await campaignRepository.update(campaign.id, {
            status: 'COMPLETED',
            completedAt: new Date(),
          });
          await campaignRepository.updateCampaignStats(campaign.id);
          this.activeCampaigns.delete(campaign.id);
          logger.info(`Campaign completed: ${campaign.name}`);

          // Create notification
          await prisma.notification.create({
            data: {
              userId: campaign.userId,
              title: 'Campaign Completed',
              message: `Campaign "${campaign.name}" has been completed.`,
              type: 'SUCCESS',
            },
          });
          break;
        }

        // Process batch with limited concurrency (e.g., 5 at a time) to be faster
        const CONCURRENCY = 5;
        for (let i = 0; i < pendingRecipients.length; i += CONCURRENCY) {
          const chunk = pendingRecipients.slice(i, i + CONCURRENCY);
          const queued = this.activeCampaigns.get(campaign.id);
          if (!queued || queued.isCancelled || queued.isPaused) break;

          await Promise.all(chunk.map(async (recipient) => {
            // Mark as sending
            await campaignRepository.updateRecipientStatus(recipient.id, 'SENDING');

            // Send email
            const result = await emailService.sendPersonalizedEmail(
              campaign.smtpAccount,
              campaign.template,
              recipient.contact,
              campaign.subject,
              attachments.length > 0 ? attachments : undefined
            );

            if (result.success) {
              await campaignRepository.updateRecipientStatus(recipient.id, 'SENT');
            } else {
              await campaignRepository.updateRecipientStatus(
                recipient.id,
                'FAILED',
                result.error
              );
            }
          }));

          // Update campaign stats periodically
          await campaignRepository.updateCampaignStats(campaign.id);

          // Delay between chunks to avoid spam
          await delay(Math.max(100, delayMs / (batchSize / CONCURRENCY)));
        }

        // Delay between batches
        await delay(delayMs);
      }
    } catch (error: any) {
      logger.error(`Campaign processing failed: ${campaign.id}`, { error: error.message });
      await campaignRepository.update(campaign.id, { status: 'FAILED' });
      await campaignRepository.updateCampaignStats(campaign.id);
      this.activeCampaigns.delete(campaign.id);

      await prisma.notification.create({
        data: {
          userId: campaign.userId,
          title: 'Campaign Failed',
          message: `Campaign "${campaign.name}" failed: ${error.message}`,
          type: 'ERROR',
        },
      });
    }
  }
}

export const queueService = new QueueService();
