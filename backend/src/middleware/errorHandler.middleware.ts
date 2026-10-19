/**
 * Centralized Error Handler Middleware
 * Catches all errors and sends standardized error responses
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/helpers';
import logger from '../utils/logger';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(err.message, {
    stack: err.stack,
    name: err.name,
  });

  // Custom application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
    return;
  }

  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        res.status(409).json({
          success: false,
          message: `A record with this ${(err.meta?.target as string[])?.join(', ') || 'field'} already exists`,
        });
        return;
      case 'P2025':
        res.status(404).json({
          success: false,
          message: 'Record not found',
        });
        return;
      case 'P2003':
        res.status(400).json({
          success: false,
          message: 'Foreign key constraint violation',
        });
        return;
      default:
        res.status(400).json({
          success: false,
          message: 'Database operation failed',
        });
        return;
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: 'Invalid data provided',
    });
    return;
  }

  // Multer file size error
  if (err.message?.includes('File too large') || err.message?.includes('LIMIT_FILE_SIZE')) {
    res.status(413).json({
      success: false,
      message: 'File size exceeds the allowed limit',
    });
    return;
  }

  // Multer file type error
  if (err.message?.includes('File type')) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token has expired',
    });
    return;
  }

  // CORS errors
  if (err.message?.includes('CORS')) {
    res.status(403).json({
      success: false,
      message: 'Not allowed by CORS policy',
    });
    return;
  }

  // Default server error
  const statusCode = 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
  });
}
