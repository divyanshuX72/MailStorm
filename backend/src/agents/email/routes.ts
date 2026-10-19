/**
 * Email Agent — Routes
 * All routes are mounted under /api/agents/email/
 */

import { Router } from 'express';
import { emailAgentController } from './controller';

const router = Router();

// Data endpoints
router.get('/templates', emailAgentController.getTemplates);
router.get('/groups', emailAgentController.getGroups);
router.get('/smtp', emailAgentController.getSmtp);
router.get('/campaigns', emailAgentController.getCampaigns);
router.get('/status', emailAgentController.getStatus);
router.get('/history', emailAgentController.getHistory);
router.get('/autocomplete', emailAgentController.getAutocomplete);

// Execution endpoint
router.post('/execute', emailAgentController.execute);

export default router;
