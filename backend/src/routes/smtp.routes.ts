/**
 * SMTP Routes
 */

import { Router } from 'express';
import { smtpController } from '../controllers/smtp.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createSmtpSchema, updateSmtpSchema, testSmtpSchema } from '../validators/smtp.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/presets', smtpController.getPresets);
router.get('/', smtpController.getAll);
router.get('/:id', smtpController.getById);
router.post('/', validateBody(createSmtpSchema), smtpController.create);
router.put('/:id', validateBody(updateSmtpSchema), smtpController.update);
router.delete('/:id', smtpController.delete);
router.post('/:id/test', validateBody(testSmtpSchema), smtpController.test);
router.patch('/:id/default', smtpController.setDefault);
router.patch('/:id/toggle', smtpController.toggleEnabled);

export default router;
