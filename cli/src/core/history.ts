/**
 * CLI — Command History
 * Persists command history in the user's config directory
 */

import { configManager } from './config';
import fs from 'fs';
import path from 'path';

const MAX_HISTORY = 100;

class CommandHistory {
  private history: string[] = [];
  private position: number = -1;
  private historyFile: string;

  constructor() {
    // Store history alongside the config file
    const configPath = configManager.getPath();
    this.historyFile = path.join(path.dirname(configPath), 'history.json');
    this.load();
  }

  /**
   * Add a command to history
   */
  add(command: string): void {
    const trimmed = command.trim();
    if (!trimmed || trimmed === this.history[0]) return;

    this.history.unshift(trimmed);
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(0, MAX_HISTORY);
    }
    this.position = -1;
    this.save();
  }

  /**
   * Navigate up in history (older)
   */
  up(): string | null {
    if (this.position < this.history.length - 1) {
      this.position++;
      return this.history[this.position];
    }
    return null;
  }

  /**
   * Navigate down in history (newer)
   */
  down(): string | null {
    if (this.position > 0) {
      this.position--;
      return this.history[this.position];
    }
    this.position = -1;
    return '';
  }

  /**
   * Reset position (after Enter)
   */
  reset(): void {
    this.position = -1;
  }

  /**
   * Get recent history
   */
  getRecent(count: number = 10): string[] {
    return this.history.slice(0, count);
  }

  /**
   * Load history from disk
   */
  private load(): void {
    try {
      if (fs.existsSync(this.historyFile)) {
        const data = fs.readFileSync(this.historyFile, 'utf-8');
        this.history = JSON.parse(data);
      }
    } catch {
      this.history = [];
    }
  }

  /**
   * Save history to disk
   */
  private save(): void {
    try {
      const dir = path.dirname(this.historyFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.historyFile, JSON.stringify(this.history), 'utf-8');
    } catch {
      // Silent fail
    }
  }
}

export const commandHistory = new CommandHistory();
