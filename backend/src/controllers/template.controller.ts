/**
 * Template Controller — Request Handlers
 */

import { Response, NextFunction } from 'express';
import { templateService } from '../services/template.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/helpers';

class TemplateController {
  /** POST /api/templates */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const template = await templateService.create(req.user!.userId, req.body);
      sendSuccess(res, template, 'Template created successfully', 201);
    } catch (error) { next(error); }
  }

  /** GET /api/templates */
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await templateService.getAll(req.user!.userId, req.query);
      sendSuccess(res, result, 'Templates retrieved');
    } catch (error) { next(error); }
  }

  /** GET /api/templates/:id */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const template = await templateService.getById(req.params.id as string, req.user!.userId);
      sendSuccess(res, template, 'Template retrieved');
    } catch (error) { next(error); }
  }

  /** PUT /api/templates/:id */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const template = await templateService.update(req.params.id as string, req.user!.userId, req.body);
      sendSuccess(res, template, 'Template updated');
    } catch (error) { next(error); }
  }

  /** DELETE /api/templates/:id */
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await templateService.delete(req.params.id as string, req.user!.userId);
      sendSuccess(res, null, 'Template deleted');
    } catch (error) { next(error); }
  }

  /** POST /api/templates/preview */
  async preview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const html = templateService.preview(req.body.htmlContent || '', req.body.variables);
      sendSuccess(res, { html }, 'Preview generated');
    } catch (error) { next(error); }
  }
}

export const templateController = new TemplateController();
