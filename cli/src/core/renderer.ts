/**
 * CLI — Terminal Renderer
 * Centralized output formatting: colors, tables, boxes, spinners
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import boxen from 'boxen';
import ora, { Ora } from 'ora';

// ============================================
// COLOR THEME
// ============================================

export const colors = {
  primary: chalk.hex('#3B82F6'),       // Blue
  secondary: chalk.hex('#8B5CF6'),     // Purple
  success: chalk.hex('#10B981'),       // Green
  warning: chalk.hex('#F59E0B'),       // Amber
  error: chalk.hex('#EF4444'),         // Red
  info: chalk.hex('#06B6D4'),          // Cyan
  muted: chalk.hex('#6B7280'),         // Gray
  white: chalk.white,
  bold: chalk.bold,
  dim: chalk.dim,
  underline: chalk.underline,

  // Agent-specific
  agentActive: chalk.hex('#10B981'),
  agentComingSoon: chalk.hex('#F59E0B'),
  agentDisabled: chalk.hex('#6B7280'),

  // Status
  statusSuccess: chalk.bgHex('#10B981').black,
  statusError: chalk.bgHex('#EF4444').white,
  statusPending: chalk.bgHex('#F59E0B').black,
  statusDraft: chalk.bgHex('#6B7280').white,
  statusRunning: chalk.bgHex('#3B82F6').white,
};

// ============================================
// RENDERER
// ============================================

export const renderer = {
  // ---------- Basic Output ----------

  log(message: string): void {
    console.log(message);
  },

  blank(): void {
    console.log('');
  },

  success(message: string): void {
    console.log(colors.success(`  ✔ ${message}`));
  },

  error(message: string): void {
    console.log(colors.error(`  ✘ ${message}`));
  },

  warning(message: string): void {
    console.log(colors.warning(`  ⚠ ${message}`));
  },

  info(message: string): void {
    console.log(colors.info(`  ℹ ${message}`));
  },

  muted(message: string): void {
    console.log(colors.muted(`  ${message}`));
  },

  // ---------- Spinners ----------

  spinner(message: string): Ora {
    return ora({
      text: message,
      color: 'cyan',
      spinner: 'dots',
      indent: 2,
    }).start();
  },

  // ---------- Boxes ----------

  box(content: string, title?: string): void {
    console.log(
      boxen(content, {
        padding: 1,
        margin: { top: 0, bottom: 0, left: 1, right: 1 },
        borderStyle: 'round',
        borderColor: '#3B82F6',
        title: title,
        titleAlignment: 'left',
      })
    );
  },

  errorBox(content: string, title?: string): void {
    console.log(
      boxen(content, {
        padding: 1,
        margin: { top: 0, bottom: 0, left: 1, right: 1 },
        borderStyle: 'round',
        borderColor: '#EF4444',
        title: title || 'Error',
        titleAlignment: 'left',
      })
    );
  },

  successBox(content: string, title?: string): void {
    console.log(
      boxen(content, {
        padding: 1,
        margin: { top: 0, bottom: 0, left: 1, right: 1 },
        borderStyle: 'round',
        borderColor: '#10B981',
        title: title || 'Success',
        titleAlignment: 'left',
      })
    );
  },

  // ---------- Tables ----------

  table(headers: string[], rows: string[][]): void {
    const table = new Table({
      head: headers.map((h) => colors.primary.bold(h)),
      style: {
        head: [],
        border: ['gray'],
      },
      chars: {
        top: '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
        bottom: '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
        left: '│', 'left-mid': '├',
        mid: '─', 'mid-mid': '┼',
        right: '│', 'right-mid': '┤',
        middle: '│',
      },
    });

    rows.forEach((row) => table.push(row));
    console.log('');
    console.log(table.toString());
    console.log('');
  },

  // ---------- Key-Value Display ----------

  keyValue(items: Array<{ key: string; value: string }>): void {
    const maxKeyLen = Math.max(...items.map((i) => i.key.length));
    items.forEach((item) => {
      const padding = ' '.repeat(maxKeyLen - item.key.length);
      console.log(`  ${colors.muted(item.key + padding)}  ${item.value}`);
    });
  },

  // ---------- Status Badges ----------

  statusBadge(status: string): string {
    const upper = status.toUpperCase();
    switch (upper) {
      case 'ACTIVE':
      case 'COMPLETED':
      case 'SUCCESS':
      case 'SENT':
        return colors.statusSuccess(` ${upper} `);
      case 'FAILED':
      case 'ERROR':
      case 'BOUNCED':
        return colors.statusError(` ${upper} `);
      case 'PENDING':
      case 'SCHEDULED':
      case 'COMING_SOON':
        return colors.statusPending(` ${upper} `);
      case 'DRAFT':
      case 'DISABLED':
        return colors.statusDraft(` ${upper} `);
      case 'RUNNING':
      case 'SENDING':
        return colors.statusRunning(` ${upper} `);
      default:
        return colors.muted(` ${upper} `);
    }
  },

  // ---------- Dividers ----------

  divider(char: string = '─', length: number = 50): void {
    console.log(colors.muted('  ' + char.repeat(length)));
  },

  // ---------- Section Headers ----------

  section(title: string): void {
    console.log('');
    console.log(colors.primary.bold(`  ${title}`));
    renderer.divider();
  },

  // ---------- Agent Display ----------

  agentStatus(status: string): string {
    switch (status) {
      case 'active':
        return colors.agentActive('● Active');
      case 'coming_soon':
        return colors.agentComingSoon('○ Coming Soon');
      case 'disabled':
        return colors.agentDisabled('○ Disabled');
      default:
        return colors.muted('○ Unknown');
    }
  },

  // ---------- Help Command ----------

  commandHelp(commands: Array<{ name: string; description: string; aliases?: string[] }>): void {
    commands.forEach((cmd) => {
      const aliases = cmd.aliases?.length ? colors.muted(` (${cmd.aliases.join(', ')})`) : '';
      console.log(`  ${colors.primary(cmd.name.padEnd(16))} ${cmd.description}${aliases}`);
    });
  },
};
