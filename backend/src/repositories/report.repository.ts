/**
 * Report Repository — Database Access Layer
 */

import prisma from '../config/database';

export class ReportRepository {
  /**
   * Get dashboard statistics for a user
   */
  async getDashboardStats(userId: string) {
    const [
      totalContacts,
      totalCampaigns,
      smtpAccounts,
      templates,
      campaignStats,
    ] = await Promise.all([
      prisma.contact.count({ where: { userId } }),
      prisma.campaign.count({ where: { userId } }),
      prisma.smtpAccount.count({ where: { userId } }),
      prisma.template.count({ where: { userId } }),
      prisma.campaign.aggregate({
        where: { userId },
        _sum: { sent: true, failed: true, totalRecipients: true },
      }),
    ]);

    const sent = campaignStats._sum.sent || 0;
    const failed = campaignStats._sum.failed || 0;
    const total = campaignStats._sum.totalRecipients || 0;

    return {
      totalContacts,
      totalCampaigns,
      emailsSent: sent,
      emailsPending: total - sent - failed,
      emailsFailed: failed,
      successRate: total > 0 ? Math.round((sent / total) * 100 * 100) / 100 : 0,
      smtpAccounts,
      templates,
    };
  }

  /**
   * Get campaign history for a user
   */
  async getCampaignHistory(userId: string, limit = 10) {
    return prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        status: true,
        totalRecipients: true,
        sent: true,
        failed: true,
        createdAt: true,
        completedAt: true,
      },
    });
  }

  /**
   * Get daily report — emails sent per day for the last N days
   */
  async getDailyReport(userId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const campaigns = await prisma.campaign.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      select: {
        sent: true,
        failed: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyMap = new Map<string, { sent: number; failed: number }>();
    campaigns.forEach((c) => {
      const dateKey = c.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || { sent: 0, failed: 0 };
      dailyMap.set(dateKey, {
        sent: existing.sent + c.sent,
        failed: existing.failed + c.failed,
      });
    });

    return Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      ...stats,
    }));
  }

  /**
   * Get monthly report — emails sent per month for the last N months
   */
  async getMonthlyReport(userId: string, months = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const campaigns = await prisma.campaign.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      select: {
        sent: true,
        failed: true,
        createdAt: true,
      },
    });

    const monthlyMap = new Map<string, { sent: number; failed: number }>();
    campaigns.forEach((c) => {
      const monthKey = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyMap.get(monthKey) || { sent: 0, failed: 0 };
      monthlyMap.set(monthKey, {
        sent: existing.sent + c.sent,
        failed: existing.failed + c.failed,
      });
    });

    return Array.from(monthlyMap.entries()).map(([month, stats]) => ({
      month,
      ...stats,
    }));
  }

  /**
   * Get SMTP usage report
   */
  async getSmtpUsage(userId: string) {
    const smtpAccounts = await prisma.smtpAccount.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        provider: true,
        sentToday: true,
        sentThisHour: true,
        maxPerHour: true,
        maxPerDay: true,
        isEnabled: true,
        _count: { select: { campaigns: true } },
      },
    });

    return smtpAccounts;
  }

  /**
   * Get recent activity logs
   */
  async getActivityLogs(userId: string, limit = 20) {
    return prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get all activity logs with pagination
   */
  async getAllActivityLogs(params: {
    skip: number;
    take: number;
    userId?: string;
    entity?: string;
    action?: string;
  }) {
    const where: any = {};
    if (params.userId) where.userId = params.userId;
    if (params.entity) where.entity = params.entity;
    if (params.action) where.action = params.action;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        skip: params.skip,
        take: params.take,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return { logs, total };
  }
}

export const reportRepository = new ReportRepository();
