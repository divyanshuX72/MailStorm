/**
 * AI Routes — AI Command Endpoint
 * Completely isolated from existing route modules
 */

import { Router } from 'express';
import { aiController } from './ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { emailLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// All AI routes require authentication
router.use(authenticate);

// POST /api/ai-command — Process a natural language command
router.post('/', emailLimiter, aiController.executeCommand);

export default router;
