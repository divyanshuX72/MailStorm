/**
 * Server Entry Point
 * Starts the Express server with graceful shutdown handling
 */

import app from './app';
import { env } from './config/env';
import prisma from './config/database';
import logger from './utils/logger';
import { testEncryption } from './services/encryption.service';
import fs from 'fs';
import path from 'path';

const PORT = env.PORT;

/**
 * Ensure required directories exist
 */
function ensureDirectories(): void {
  const dirs = [
    path.join(env.UPLOAD_DIR, 'attachments'),
    path.join(env.UPLOAD_DIR, 'imports'),
    path.join(env.UPLOAD_DIR, 'templates'),
    path.join(env.UPLOAD_DIR, 'avatars'),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  });
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Ensure upload directories
    ensureDirectories();

    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Test encryption
    const encryptionOk = testEncryption();
    if (encryptionOk) {
      logger.info('✅ Encryption service is working');
    } else {
      logger.error('❌ Encryption service test failed');
      process.exit(1);
    }

    // Start listening
    const server = app.listen(PORT, () => {
      logger.info(`
╔══════════════════════════════════════════════════╗
║     Email Campaign Management System API         ║
║──────────────────────────────────────────────────║
║  Environment : ${env.NODE_ENV.padEnd(33)}║
║  Port        : ${String(PORT).padEnd(33)}║
║  API URL     : ${env.API_URL.padEnd(33)}║
║  Frontend    : ${env.APP_URL.padEnd(33)}║
╚══════════════════════════════════════════════════╝
      `);
    });

    // ============================================
    // GRACEFUL SHUTDOWN
    // ============================================

    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        // Disconnect Prisma
        await prisma.$disconnect();
        logger.info('Database disconnected');

        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after 10 seconds');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled errors
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection', { reason: String(reason) });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: String(error) });
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
