/**
 * Excel Utility
 * Helpers for Excel/CSV import and export operations
 */

import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

/**
 * Read an Excel or CSV file and return parsed rows
 */
export function readSpreadsheet(filePath: string): Record<string, any>[] {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
}

/**
 * Create an Excel file from data
 */
export function createExcelFile(
  data: Record<string, any>[],
  sheetName: string,
  outputPath: string
): string {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-fit column widths
  if (data.length > 0) {
    const maxWidth = 40;
    const colWidths = Object.keys(data[0]).map((key) => ({
      wch: Math.min(
        maxWidth,
        Math.max(key.length + 2, ...data.map((row) => String(row[key] || '').length))
      ),
    }));
    ws['!cols'] = colWidths;
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, outputPath);

  return outputPath;
}

/**
 * Validate that a file is a valid spreadsheet
 */
export function isValidSpreadsheet(filePath: string): boolean {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.csv', '.xlsx', '.xls'].includes(ext)) return false;

    XLSX.readFile(filePath);
    return true;
  } catch {
    return false;
  }
}
