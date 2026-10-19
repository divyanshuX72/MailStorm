/**
 * Campaign Controller — Request Handlers
 */

import { Response, NextFunction } from 'express';
import { campaignService } from '../services/campaign.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/helpers';

class CampaignController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaign = await campaignService.create(req.user!.userId, req.body);
      sendSuccess(res, campaign, 'Campaign created successfully', 201);
    } catch (error) { next(error); }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await campaignService.getAll(req.user!.userId, req.query);
      sendSuccess(res, result, 'Campaigns retrieved');
    } catch (error) { next(error); }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaign = await campaignService.getById(req.params.id as string, req.user!.userId);
      sendSuccess(res, campaign, 'Campaign retrieved');
    } catch (error) { next(error); }
  }

  async start(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await campaignService.start(req.params.id as string, req.user!.userId);
      sendSuccess(res, null, 'Campaign started');
    } catch (error) { next(error); }
  }

  async pause(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await campaignService.pause(req.params.id as string, req.user!.userId);
      sendSuccess(res, null, 'Campaign paused');
    } catch (error) { next(error); }
  }

  async resume(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await campaignService.resume(req.params.id as string, req.user!.userId);
      sendSuccess(res, null, 'Campaign resumed');
    } catch (error) { next(error); }
  }

  async cancel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await campaignService.cancel(req.params.id as string, req.user!.userId);
      sendSuccess(res, null, 'Campaign cancelled');
    } catch (error) { next(error); }
  }

  async retryFailed(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await campaignService.retryFailed(req.params.id as string, req.user!.userId);
      sendSuccess(res, null, 'Retrying failed emails');
    } catch (error) { next(error); }
  }

  async getProgress(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const progress = await campaignService.getProgress(req.params.id as string, req.user!.userId);
      sendSuccess(res, progress, 'Progress retrieved');
    } catch (error) { next(error); }
  }

  async getRecipients(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await campaignService.getRecipients(req.params.id as string, req.user!.userId, req.query);
      sendSuccess(res, result, 'Recipients retrieved');
    } catch (error) { next(error); }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await campaignService.delete(req.params.id as string, req.user!.userId);
      sendSuccess(res, null, 'Campaign deleted');
    } catch (error) { next(error); }
  }

  async duplicate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaign = await campaignService.duplicate(req.params.id as string, req.user!.userId);
      sendSuccess(res, campaign, 'Campaign duplicated', 201);
    } catch (error) { next(error); }
  }

  async rerun(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaign = await campaignService.rerun(req.params.id as string, req.user!.userId);
      sendSuccess(res, campaign, 'Campaign rerun successfully', 201);
    } catch (error) { next(error); }
  }
}

export const campaignController = new CampaignController();
