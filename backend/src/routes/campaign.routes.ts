/**
 * Campaign Routes
 */

import { Router } from 'express';
import { campaignController } from '../controllers/campaign.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { emailLimiter } from '../middleware/rateLimiter.middleware';
import { attachmentUpload } from '../config/multer';
import { createCampaignSchema } from '../validators/campaign.validator';

const router = Router();

router.use(authenticate);

router.get('/', campaignController.getAll);
router.get('/:id', campaignController.getById);
router.post('/', validateBody(createCampaignSchema), campaignController.create);
router.delete('/:id', campaignController.delete);
router.post('/:id/duplicate', campaignController.duplicate);
router.post('/:id/rerun', emailLimiter, campaignController.rerun);

// Campaign actions
router.post('/:id/start', emailLimiter, campaignController.start);
router.post('/:id/pause', campaignController.pause);
router.post('/:id/resume', campaignController.resume);
router.post('/:id/cancel', campaignController.cancel);
router.post('/:id/retry', emailLimiter, campaignController.retryFailed);

// Campaign progress and recipients
router.get('/:id/progress', campaignController.getProgress);
router.get('/:id/recipients', campaignController.getRecipients);

export default router;
