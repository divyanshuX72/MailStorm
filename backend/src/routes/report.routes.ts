/**
 * Report Routes
 */

import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/dashboard', reportController.getDashboard);
router.get('/campaign-history', reportController.getCampaignHistory);
router.get('/daily', reportController.getDailyReport);
router.get('/monthly', reportController.getMonthlyReport);
router.get('/smtp-usage', reportController.getSmtpUsage);
router.get('/activity-logs', reportController.getActivityLogs);
router.get('/export/excel', reportController.exportExcel);

export default router;
