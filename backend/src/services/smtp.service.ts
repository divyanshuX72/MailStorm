/**
 * SMTP Service — Business Logic
 * Manages SMTP accounts, connection testing, and provider presets
 */

import nodemailer from 'nodemailer';
import { smtpRepository } from '../repositories/smtp.repository';
import { encrypt, decrypt } from './encryption.service';
import { AppError } from '../utils/helpers';
import { SMTP_PRESETS } from '../utils/constants';
import { SmtpInput, SmtpTestResult } from '../types';
import logger from '../utils/logger';
import prisma from '../config/database';
import { SmtpAccount } from '@prisma/client';

class SmtpService {
  /**
   * Create a new SMTP account
   */
  async create(userId: string, input: SmtpInput): Promise<Omit<SmtpAccount, 'encryptedPassword'>> {
    // Encrypt the SMTP password
    const encryptedPassword = encrypt(input.password);

    const smtp = await smtpRepository.create({
      name: input.name,
      host: input.host,
      port: input.port,
      username: input.username,
      encryptedPassword,
      encryption: input.encryption,
      fromEmail: input.fromEmail,
      fromName: input.fromName,
      provider: input.provider,
      maxPerHour: input.maxPerHour || 100,
      maxPerDay: input.maxPerDay || 2000,
      user: { connect: { id: userId } },
    });

    // Log activity
    await this.logActivity(userId, 'CREATE', smtp.id);

    logger.info(`SMTP account created: ${smtp.name}`, { userId });
    const { encryptedPassword: _, ...safeSMTP } = smtp;
    return safeSMTP;
  }

  /**
   * Get all SMTP accounts for a user
   */
  async getAll(userId: string): Promise<Omit<SmtpAccount, 'encryptedPassword'>[]> {
    const accounts = await smtpRepository.findByUserId(userId);
    return accounts.map(({ encryptedPassword, ...rest }) => rest);
  }

  /**
   * Get a single SMTP account by ID
   */
  async getById(id: string, userId: string): Promise<Omit<SmtpAccount, 'encryptedPassword'>> {
    const smtp = await smtpRepository.findById(id);
    if (!smtp || smtp.userId !== userId) {
      throw new AppError('SMTP account not found', 404);
    }
    const { encryptedPassword, ...safeSMTP } = smtp;
    return safeSMTP;
  }

  /**
   * Update an SMTP account
   */
  async update(id: string, userId: string, input: Partial<SmtpInput>): Promise<Omit<SmtpAccount, 'encryptedPassword'>> {
    const smtp = await smtpRepository.findById(id);
    if (!smtp || smtp.userId !== userId) {
      throw new AppError('SMTP account not found', 404);
    }

    const updateData: any = { ...input };

    // If password is provided, encrypt it
    if (input.password) {
      updateData.encryptedPassword = encrypt(input.password);
      delete updateData.password;
    }

    const updated = await smtpRepository.update(id, updateData);
    await this.logActivity(userId, 'UPDATE', id);

    const { encryptedPassword, ...safeSMTP } = updated;
    return safeSMTP;
  }

  /**
   * Delete an SMTP account
   */
  async delete(id: string, userId: string): Promise<void> {
    const smtp = await smtpRepository.findById(id);
    if (!smtp || smtp.userId !== userId) {
      throw new AppError('SMTP account not found', 404);
    }

    // Check if linked to any campaigns
    const campaignCount = await prisma.campaign.count({
      where: { smtpAccountId: id },
    });

    if (campaignCount > 0) {
      throw new AppError(
        `Cannot delete SMTP account because it is linked to ${campaignCount} campaign(s). Please delete or reassign those campaigns first.`,
        400
      );
    }

    await smtpRepository.delete(id);
    await this.logActivity(userId, 'DELETE', id);
    logger.info(`SMTP account deleted: ${smtp.name}`, { userId });
  }

  /**
   * Test SMTP connection by sending a test email
   */
  async testConnection(id: string, userId: string, testEmail: string): Promise<SmtpTestResult> {
    const smtp = await smtpRepository.findById(id);
    if (!smtp || smtp.userId !== userId) {
      throw new AppError('SMTP account not found', 404);
    }

    const startTime = Date.now();

    try {
      const password = decrypt(smtp.encryptedPassword);
      const transporter = this.createTransporter(smtp.host, smtp.port, smtp.encryption, smtp.username, password);

      // Verify connection
      await transporter.verify();

      // Send test email
      await transporter.sendMail({
        from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
        to: testEmail,
        subject: 'SMTP Test — Email Campaign Manager',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>✅ SMTP Connection Test Successful</h2>
            <p>This is a test email from your Email Campaign Manager.</p>
            <p><strong>SMTP Account:</strong> ${smtp.name}</p>
            <p><strong>Provider:</strong> ${smtp.provider}</p>
            <p><strong>Host:</strong> ${smtp.host}:${smtp.port}</p>
            <p style="color: #666; font-size: 12px;">Sent at ${new Date().toISOString()}</p>
          </div>
        `,
      });

      const responseTime = Date.now() - startTime;
      await this.logActivity(userId, 'TEST', id);

      return {
        success: true,
        message: 'SMTP connection test successful. Test email sent.',
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      logger.error('SMTP test failed', { error: error.message, smtpId: id });

      return {
        success: false,
        message: `SMTP test failed: ${error.message}`,
        responseTime,
      };
    }
  }

  /**
   * Set an SMTP account as default
   */
  async setDefault(id: string, userId: string): Promise<void> {
    const smtp = await smtpRepository.findById(id);
    if (!smtp || smtp.userId !== userId) {
      throw new AppError('SMTP account not found', 404);
    }

    await smtpRepository.setDefault(id, userId);
  }

  /**
   * Toggle enable/disable for an SMTP account
   */
  async toggleEnabled(id: string, userId: string): Promise<boolean> {
    const smtp = await smtpRepository.findById(id);
    if (!smtp || smtp.userId !== userId) {
      throw new AppError('SMTP account not found', 404);
    }

    const updated = await smtpRepository.update(id, { isEnabled: !smtp.isEnabled });
    return updated.isEnabled;
  }

  /**
   * Get SMTP provider presets
   */
  getProviderPresets() {
    return SMTP_PRESETS;
  }

  /**
   * Create a Nodemailer transporter from SMTP account
   */
  createTransporter(host: string, port: number, encryption: string, username: string, password: string) {
    return nodemailer.createTransport({
      host,
      port,
      secure: encryption === 'SSL',
      auth: { user: username, pass: password },
      tls: {
        rejectUnauthorized: false,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 10,
    });
  }

  /**
   * Get a ready-to-use transporter for a specific SMTP account
   */
  async getTransporter(smtpId: string): Promise<{ transporter: nodemailer.Transporter; smtp: SmtpAccount }> {
    const smtp = await smtpRepository.findById(smtpId);
    if (!smtp) {
      throw new AppError('SMTP account not found', 404);
    }

    const password = decrypt(smtp.encryptedPassword);
    const transporter = this.createTransporter(smtp.host, smtp.port, smtp.encryption, smtp.username, password);

    return { transporter, smtp };
  }

  private async logActivity(userId: string, action: string, entityId: string): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          userId,
          action,
          entity: 'SmtpAccount',
          entityId,
        },
      });
    } catch (error) {
      logger.error('Failed to log SMTP activity', { error });
    }
  }
}

export const smtpService = new SmtpService();
