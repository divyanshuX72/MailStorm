/**
 * Report Controller — Request Handlers
 */

import { Response, NextFunction } from 'express';
import { reportService } from '../services/report.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/helpers';
import { parsePagination } from '../utils/pagination';
import path from 'path';

class ReportController {
  async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await reportService.getDashboardStats(req.user!.userId);
      sendSuccess(res, stats, 'Dashboard stats retrieved');
    } catch (error) { next(error); }
  }

  async getCampaignHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Number(req.query.limit) || 10;
      const history = await reportService.getCampaignHistory(req.user!.userId, limit);
      sendSuccess(res, history, 'Campaign history retrieved');
    } catch (error) { next(error); }
  }

  async getDailyReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = Number(req.query.days) || 30;
      const report = await reportService.getDailyReport(req.user!.userId, days);
      sendSuccess(res, report, 'Daily report retrieved');
    } catch (error) { next(error); }
  }

  async getMonthlyReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const months = Number(req.query.months) || 12;
      const report = await reportService.getMonthlyReport(req.user!.userId, months);
      sendSuccess(res, report, 'Monthly report retrieved');
    } catch (error) { next(error); }
  }

  async getSmtpUsage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usage = await reportService.getSmtpUsage(req.user!.userId);
      sendSuccess(res, usage, 'SMTP usage retrieved');
    } catch (error) { next(error); }
  }

  async getActivityLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { skip, limit } = parsePagination(req.query as any);
      const result = await reportService.getAllActivityLogs({
        skip,
        take: limit,
        userId: req.user!.userId,
        entity: req.query.entity as string,
        action: req.query.action as string,
      });
      sendSuccess(res, result, 'Activity logs retrieved');
    } catch (error) { next(error); }
  }

  async exportExcel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.query.type as string || 'daily';
      let data: any[];

      if (type === 'monthly') {
        data = await reportService.getMonthlyReport(req.user!.userId);
      } else {
        data = await reportService.getDailyReport(req.user!.userId);
      }

      if (data.length === 0) {
        res.status(404).json({ success: false, message: 'No data to export' });
        return;
      }

      const filepath = await reportService.exportExcel(data, `${type}-report`);
      res.download(filepath, `${type}-report.xlsx`, () => {
        // Clean up temp file after download
        try { require('fs').unlinkSync(filepath); } catch { /* ignore */ }
      });
    } catch (error) { next(error); }
  }
}

export const reportController = new ReportController();
