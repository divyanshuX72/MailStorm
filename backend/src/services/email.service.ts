/**
 * Email Service — Nodemailer Engine
 * Handles sending individual emails with retry logic and connection pooling
 */

import nodemailer from 'nodemailer';
import { smtpService } from './smtp.service';
import { decrypt } from './encryption.service';
import { replaceTemplateVariables } from '../utils/helpers';
import { smtpRepository } from '../repositories/smtp.repository';
import logger from '../utils/logger';
import { Contact, SmtpAccount, Template } from '@prisma/client';
import path from 'path';

interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  fromName?: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private transporterCache: Map<string, nodemailer.Transporter> = new Map();

  /**
   * Send a single email using a specific SMTP account
   */
  async sendEmail(smtpId: string, options: SendEmailOptions): Promise<SendResult> {
    try {
      const transporter = await this.getOrCreateTransporter(smtpId);

      const mailOptions: nodemailer.SendMailOptions = {
        from: options.from
          ? `"${options.fromName || ''}" <${options.from}>`
          : undefined,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      };

      const info = await transporter.sendMail(mailOptions);

      // Increment SMTP send counter
      await smtpRepository.incrementSentCount(smtpId);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      logger.error(`Email send failed to ${options.to}`, { error: error.message });

      // If transport error, remove from cache to recreate
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'EAUTH') {
        this.transporterCache.delete(smtpId);
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send personalized email to a contact using a template
   */
  async sendPersonalizedEmail(
    smtpAccount: SmtpAccount,
    template: Template,
    contact: Contact,
    subject: string,
    attachments?: Array<{ filename: string; path: string }>
  ): Promise<SendResult> {
    // Build variable map from contact data
    const variables: Record<string, string> = {
      name: [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email,
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email,
      company: contact.company || '',
      phone: contact.phone || '',
      unsubscribeLink: `#unsubscribe-${contact.id}`,
    };

    // Replace variables in subject and content
    const personalizedSubject = replaceTemplateVariables(subject, variables);
    const personalizedHtml = template.htmlContent
      ? replaceTemplateVariables(template.htmlContent, variables)
      : undefined;
    const personalizedText = template.textContent
      ? replaceTemplateVariables(template.textContent, variables)
      : undefined;

    return this.sendEmail(smtpAccount.id, {
      to: contact.email,
      subject: personalizedSubject,
      html: personalizedHtml,
      text: personalizedText,
      from: smtpAccount.fromEmail,
      fromName: smtpAccount.fromName,
      attachments,
    });
  }

  /**
   * Send email with retry logic
   */
  async sendWithRetry(
    smtpId: string,
    options: SendEmailOptions,
    maxRetries = 3
  ): Promise<SendResult> {
    let lastError = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.sendEmail(smtpId, options);

      if (result.success) {
        return result;
      }

      lastError = result.error || 'Unknown error';
      logger.warn(`Email retry ${attempt}/${maxRetries} for ${options.to}`, { error: lastError });

      // Exponential backoff: 1s, 2s, 4s
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return {
      success: false,
      error: `Failed after ${maxRetries} attempts: ${lastError}`,
    };
  }

  /**
   * Get or create a cached transporter for an SMTP account
   */
  private async getOrCreateTransporter(smtpId: string): Promise<nodemailer.Transporter> {
    let transporter = this.transporterCache.get(smtpId);

    if (!transporter) {
      const smtp = await smtpRepository.findById(smtpId);
      if (!smtp) {
        throw new Error('SMTP account not found');
      }

      if (!smtp.isEnabled) {
        throw new Error('SMTP account is disabled');
      }

      const password = decrypt(smtp.encryptedPassword);

      transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.encryption === 'SSL',
        auth: { user: smtp.username, pass: password },
        tls: { rejectUnauthorized: false },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 10,
      });

      this.transporterCache.set(smtpId, transporter);
    }

    return transporter;
  }

  /**
   * Clear transporter cache (useful when SMTP settings change)
   */
  clearCache(smtpId?: string): void {
    if (smtpId) {
      const transporter = this.transporterCache.get(smtpId);
      if (transporter) {
        transporter.close();
        this.transporterCache.delete(smtpId);
      }
    } else {
      this.transporterCache.forEach((t) => t.close());
      this.transporterCache.clear();
    }
  }
}

export const emailService = new EmailService();
