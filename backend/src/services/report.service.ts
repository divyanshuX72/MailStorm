/**
 * Report Service — Business Logic
 */

import { reportRepository } from '../repositories/report.repository';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

class ReportService {
  async getDashboardStats(userId: string) {
    return reportRepository.getDashboardStats(userId);
  }

  async getCampaignHistory(userId: string, limit?: number) {
    return reportRepository.getCampaignHistory(userId, limit);
  }

  async getDailyReport(userId: string, days?: number) {
    return reportRepository.getDailyReport(userId, days);
  }

  async getMonthlyReport(userId: string, months?: number) {
    return reportRepository.getMonthlyReport(userId, months);
  }

  async getSmtpUsage(userId: string) {
    return reportRepository.getSmtpUsage(userId);
  }

  async getActivityLogs(userId: string, limit?: number) {
    return reportRepository.getActivityLogs(userId, limit);
  }

  async getAllActivityLogs(params: {
    skip: number;
    take: number;
    userId?: string;
    entity?: string;
    action?: string;
  }) {
    return reportRepository.getAllActivityLogs(params);
  }

  /**
   * Export report data as Excel
   */
  async exportExcel(data: any[], sheetName: string): Promise<string> {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-fit column widths
    const maxWidth = 30;
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.min(
        maxWidth,
        Math.max(key.length, ...data.map((row) => String(row[key] || '').length))
      ),
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const filename = `report-${Date.now()}.xlsx`;
    const filepath = path.join(env.UPLOAD_DIR, 'exports', filename);

    // Ensure export directory exists
    const exportDir = path.join(env.UPLOAD_DIR, 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    XLSX.writeFile(wb, filepath);
    return filepath;
  }
}

export const reportService = new ReportService();
