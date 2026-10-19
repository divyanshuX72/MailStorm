/**
 * Route Index — Central Route Registry
 * All API routes are registered here
 */

import { Router } from 'express';
import authRoutes from './auth.routes';
import smtpRoutes from './smtp.routes';
import contactRoutes from './contact.routes';
import templateRoutes from './template.routes';
import campaignRoutes from './campaign.routes';
import reportRoutes from './report.routes';
import aiRoutes from '../ai/ai.routes';
import agentRouter from '../agents/router';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Email Campaign Management API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Register route modules
router.use('/auth', authRoutes);
router.use('/smtp', smtpRoutes);
router.use('/contacts', contactRoutes);
router.use('/templates', templateRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/reports', reportRoutes);
router.use('/ai-command', aiRoutes);
router.use('/agents', agentRouter);

export default router;
