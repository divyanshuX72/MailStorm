/**
 * Main Agent — Routes
 * All routes mounted under /api/agents/main/
 */

import { Router } from 'express';
import { mainAgentController } from './controller';

const router = Router();

router.get('/status', mainAgentController.getStatus);
router.get('/history', mainAgentController.getHistory);
router.post('/execute', mainAgentController.execute);

export default router;
