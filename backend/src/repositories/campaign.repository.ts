/**
 * Campaign Repository — Database Access Layer
 */

import prisma from '../config/database';
import { Prisma, Campaign, CampaignRecipient } from '@prisma/client';

export class CampaignRepository {
  async create(data: Prisma.CampaignCreateInput): Promise<Campaign> {
    return prisma.campaign.create({ data });
  }

  async findById(id: string): Promise<Campaign | null> {
    return prisma.campaign.findUnique({
      where: { id },
      include: {
        smtpAccount: { select: { id: true, name: true, fromEmail: true, provider: true } },
        template: { select: { id: true, name: true, type: true } },
        _count: { select: { recipients: true, attachments: true } },
      },
    });
  }

  async findAll(params: {
    skip: number;
    take: number;
    where?: Prisma.CampaignWhereInput;
    orderBy?: Prisma.CampaignOrderByWithRelationInput;
  }) {
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
        include: {
          smtpAccount: { select: { name: true, provider: true } },
          template: { select: { name: true } },
          _count: { select: { recipients: true } },
        },
      }),
      prisma.campaign.count({ where: params.where }),
    ]);
    return { campaigns, total };
  }

  async update(id: string, data: Prisma.CampaignUpdateInput): Promise<Campaign> {
    return prisma.campaign.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Campaign> {
    return prisma.campaign.delete({ where: { id } });
  }

  // Recipient operations
  async addRecipients(data: Prisma.CampaignRecipientCreateManyInput[]): Promise<number> {
    const result = await prisma.campaignRecipient.createMany({
      data,
      skipDuplicates: true,
    });
    return result.count;
  }

  async getRecipients(campaignId: string, params?: {
    skip?: number;
    take?: number;
    status?: string;
  }) {
    const where: Prisma.CampaignRecipientWhereInput = { campaignId };
    if (params?.status) {
      where.status = params.status as any;
    }

    const [recipients, total] = await Promise.all([
      prisma.campaignRecipient.findMany({
        where,
        skip: params?.skip,
        take: params?.take,
        include: {
          contact: { select: { email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.campaignRecipient.count({ where }),
    ]);
    return { recipients, total };
  }

  async getPendingRecipients(campaignId: string, limit: number): Promise<CampaignRecipient[]> {
    return prisma.campaignRecipient.findMany({
      where: {
        campaignId,
        status: { in: ['PENDING', 'QUEUED'] },
      },
      take: limit,
      include: {
        contact: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getFailedRecipients(campaignId: string): Promise<CampaignRecipient[]> {
    return prisma.campaignRecipient.findMany({
      where: {
        campaignId,
        status: 'FAILED',
        retryCount: { lt: 3 },
      },
      include: { contact: true },
    });
  }

  async updateRecipientStatus(
    id: string,
    status: string,
    error?: string
  ): Promise<CampaignRecipient> {
    const data: Prisma.CampaignRecipientUpdateInput = {
      status: status as any,
    };

    if (status === 'SENT') {
      data.sentAt = new Date();
    }
    if (error) {
      data.error = error;
    }
    if (status === 'FAILED') {
      data.retryCount = { increment: 1 };
    }

    return prisma.campaignRecipient.update({ where: { id }, data });
  }

  async updateCampaignStats(campaignId: string): Promise<void> {
    const stats = await prisma.campaignRecipient.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: { status: true },
    });

    let sent = 0, failed = 0;
    stats.forEach((s) => {
      if (s.status === 'SENT') sent = s._count.status;
      if (s.status === 'FAILED') failed = s._count.status;
    });

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { sent, failed },
    });
  }

  // Attachment operations
  async addAttachment(data: Prisma.AttachmentCreateInput) {
    return prisma.attachment.create({ data });
  }

  async getAttachments(campaignId: string) {
    return prisma.attachment.findMany({ where: { campaignId } });
  }

  async deleteAttachment(id: string) {
    return prisma.attachment.delete({ where: { id } });
  }

  async count(userId: string): Promise<number> {
    return prisma.campaign.count({ where: { userId } });
  }

  async findScheduledCampaigns(): Promise<Campaign[]> {
    return prisma.campaign.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: new Date() },
      },
      include: {
        smtpAccount: true,
        template: true,
      },
    });
  }
}

export const campaignRepository = new CampaignRepository();
