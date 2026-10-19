/**
 * SMTP Controller — Request Handlers
 */

import { Response, NextFunction } from 'express';
import { smtpService } from '../services/smtp.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/helpers';

class SmtpController {
  /** POST /api/smtp */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const smtp = await smtpService.create(req.user!.userId, req.body);
      sendSuccess(res, smtp, 'SMTP account created successfully', 201);
    } catch (error) { next(error); }
  }

  /** GET /api/smtp */
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const accounts = await smtpService.getAll(req.user!.userId);
      sendSuccess(res, accounts, 'SMTP accounts retrieved');
    } catch (error) { next(error); }
  }

  /** GET /api/smtp/:id */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const smtp = await smtpService.getById(req.params.id as string, req.user!.userId);
      sendSuccess(res, smtp, 'SMTP account retrieved');
    } catch (error) { next(error); }
  }

  /** PUT /api/smtp/:id */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const smtp = await smtpService.update(req.params.id as string, req.user!.userId, req.body);
      sendSuccess(res, smtp, 'SMTP account updated');
    } catch (error) { next(error); }
  }

  /** DELETE /api/smtp/:id */
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await smtpService.delete(req.params.id as string, req.user!.userId);
      sendSuccess(res, null, 'SMTP account deleted');
    } catch (error) { next(error); }
  }

  /** POST /api/smtp/:id/test */
  async test(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await smtpService.testConnection(req.params.id as string, req.user!.userId, req.body.testEmail);
      sendSuccess(res, result, result.message);
    } catch (error) { next(error); }
  }

  /** PATCH /api/smtp/:id/default */
  async setDefault(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await smtpService.setDefault(req.params.id as string, req.user!.userId);
      sendSuccess(res, null, 'Default SMTP set');
    } catch (error) { next(error); }
  }

  /** PATCH /api/smtp/:id/toggle */
  async toggleEnabled(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const isEnabled = await smtpService.toggleEnabled(req.params.id as string, req.user!.userId);
      sendSuccess(res, { isEnabled }, `SMTP account ${isEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) { next(error); }
  }

  /** GET /api/smtp/presets */
  async getPresets(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const presets = smtpService.getProviderPresets();
      sendSuccess(res, presets, 'SMTP presets retrieved');
    } catch (error) { next(error); }
  }
}

export const smtpController = new SmtpController();
