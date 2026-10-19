/**
 * Logger Utility
 * Structured logging for the application
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

class Logger {
  private level: number;

  constructor() {
    const envLevel = (process.env.NODE_ENV === 'production' ? 'WARN' : 'DEBUG') as LogLevel;
    this.level = LOG_LEVELS[envLevel];
  }

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  error(message: string, meta?: Record<string, unknown>): void {
    if (this.level >= LOG_LEVELS.ERROR) {
      console.error(this.formatMessage('ERROR', message, meta));
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (this.level >= LOG_LEVELS.WARN) {
      console.warn(this.formatMessage('WARN', message, meta));
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (this.level >= LOG_LEVELS.INFO) {
      console.info(this.formatMessage('INFO', message, meta));
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message, meta));
    }
  }
}

export const logger = new Logger();
export default logger;
