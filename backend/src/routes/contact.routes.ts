/**
 * Contact Routes
 */

import { Router } from 'express';
import { contactController } from '../controllers/contact.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { uploadLimiter } from '../middleware/rateLimiter.middleware';
import { importUpload } from '../config/multer';
import { createContactSchema, updateContactSchema, bulkDeleteSchema } from '../validators/contact.validator';

const router = Router();

router.use(authenticate);

// Static routes first (before :id param)
router.get('/groups', contactController.getGroups);
router.get('/tags', contactController.getTags);
router.post('/import', uploadLimiter, importUpload.single('file'), contactController.import);
router.post('/bulk-delete', validateBody(bulkDeleteSchema), contactController.bulkDelete);

// CRUD routes
router.get('/', contactController.getAll);
router.get('/:id', contactController.getById);
router.post('/', validateBody(createContactSchema), contactController.create);
router.put('/:id', validateBody(updateContactSchema), contactController.update);
router.delete('/:id', contactController.delete);

export default router;
