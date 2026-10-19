/**
 * Template Routes
 */

import { Router } from 'express';
import { templateController } from '../controllers/template.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createTemplateSchema, updateTemplateSchema } from '../validators/template.validator';

const router = Router();

router.use(authenticate);

router.post('/preview', templateController.preview);
router.get('/', templateController.getAll);
router.get('/:id', templateController.getById);
router.post('/', validateBody(createTemplateSchema), templateController.create);
router.put('/:id', validateBody(updateTemplateSchema), templateController.update);
router.delete('/:id', templateController.delete);

export default router;
