/**
 * Contact Controller — Request Handlers
 */

import { Response, NextFunction } from 'express';
import { contactService } from '../services/contact.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/helpers';

class ContactController {
  /** POST /api/contacts */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const contact = await contactService.create(req.user!.userId, req.body);
      sendSuccess(res, contact, 'Contact created successfully', 201);
    } catch (error) { next(error); }
  }

  /** GET /api/contacts */
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await contactService.getAll(req.user!.userId, req.query);
      sendSuccess(res, result, 'Contacts retrieved');
    } catch (error) { next(error); }
  }

  /** GET /api/contacts/:id */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const contact = await contactService.getById(req.params.id as string, req.user!.userId);
      sendSuccess(res, contact, 'Contact retrieved');
    } catch (error) { next(error); }
  }

  /** PUT /api/contacts/:id */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const contact = await contactService.update(req.params.id as string, req.user!.userId, req.body);
      sendSuccess(res, contact, 'Contact updated');
    } catch (error) { next(error); }
  }

  /** DELETE /api/contacts/:id */
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await contactService.delete(req.params.id as string, req.user!.userId);
      sendSuccess(res, null, 'Contact deleted');
    } catch (error) { next(error); }
  }

  /** POST /api/contacts/bulk-delete */
  async bulkDelete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await contactService.bulkDelete(req.body.ids, req.user!.userId);
      sendSuccess(res, { deletedCount: count }, `${count} contacts deleted`);
    } catch (error) { next(error); }
  }

  /** POST /api/contacts/import */
  async import(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'File is required' });
        return;
      }

      const result = await contactService.importContacts(
        req.user!.userId,
        req.file.path,
        req.body.groupName
      );
      sendSuccess(res, result, `Imported ${result.imported} of ${result.total} contacts`);
    } catch (error) { next(error); }
  }

  /** GET /api/contacts/groups */
  async getGroups(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const groups = await contactService.getGroups(req.user!.userId);
      sendSuccess(res, groups, 'Groups retrieved');
    } catch (error) { next(error); }
  }

  /** GET /api/contacts/tags */
  async getTags(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tags = await contactService.getTags(req.user!.userId);
      sendSuccess(res, tags, 'Tags retrieved');
    } catch (error) { next(error); }
  }
}

export const contactController = new ContactController();
