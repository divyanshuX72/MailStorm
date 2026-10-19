/**
 * SMTP Repository — Database Access Layer
 */

import prisma from '../config/database';
import { Prisma, SmtpAccount } from '@prisma/client';

export class SmtpRepository {
  async create(data: Prisma.SmtpAccountCreateInput): Promise<SmtpAccount> {
    return prisma.smtpAccount.create({ data });
  }

  async findById(id: string): Promise<SmtpAccount | null> {
    return prisma.smtpAccount.findUnique({ where: { id } });
  }

  async findByUserId(userId: string): Promise<SmtpAccount[]> {
    return prisma.smtpAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findDefault(userId: string): Promise<SmtpAccount | null> {
    return prisma.smtpAccount.findFirst({
      where: { userId, isDefault: true, isEnabled: true },
    });
  }

  async findEnabled(userId: string): Promise<SmtpAccount[]> {
    return prisma.smtpAccount.findMany({
      where: { userId, isEnabled: true },
    });
  }

  async update(id: string, data: Prisma.SmtpAccountUpdateInput): Promise<SmtpAccount> {
    return prisma.smtpAccount.update({ where: { id }, data });
  }

  async delete(id: string): Promise<SmtpAccount> {
    return prisma.smtpAccount.delete({ where: { id } });
  }

  async clearDefault(userId: string): Promise<void> {
    await prisma.smtpAccount.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  async setDefault(id: string, userId: string): Promise<SmtpAccount> {
    const current = await this.findById(id);
    const isCurrentlyDefault = current?.isDefault;

    // Clear existing default
    await this.clearDefault(userId);

    // If it was already default, we leave it cleared (toggle off)
    if (isCurrentlyDefault) {
      return current!;
    }

    // Set new default
    return prisma.smtpAccount.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async incrementSentCount(id: string): Promise<void> {
    await prisma.smtpAccount.update({
      where: { id },
      data: {
        sentToday: { increment: 1 },
        sentThisHour: { increment: 1 },
      },
    });
  }

  async resetHourlyCount(id: string): Promise<void> {
    await prisma.smtpAccount.update({
      where: { id },
      data: { sentThisHour: 0 },
    });
  }

  async resetDailyCount(id: string): Promise<void> {
    await prisma.smtpAccount.update({
      where: { id },
      data: { sentToday: 0, lastResetAt: new Date() },
    });
  }

  async count(userId: string): Promise<number> {
    return prisma.smtpAccount.count({ where: { userId } });
  }
}

export const smtpRepository = new SmtpRepository();
