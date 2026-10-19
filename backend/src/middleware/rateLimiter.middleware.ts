/**
 * Rate Limiter Middleware
 * Protects against brute-force and DDoS attacks
 */

import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../utils/constants';

/**
 * General API rate limiter — 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: RATE_LIMITS.GENERAL.windowMs,
  max: RATE_LIMITS.GENERAL.max,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Authentication rate limiter — 10 requests per 15 minutes
 * Protects login, register, and password reset endpoints
 */
export const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.windowMs,
  max: RATE_LIMITS.AUTH.max,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Email sending rate limiter — 20 requests per hour
 * Protects campaign start and test email endpoints
 */
export const emailLimiter = rateLimit({
  windowMs: RATE_LIMITS.EMAIL.windowMs,
  max: RATE_LIMITS.EMAIL.max,
  message: {
    success: false,
    message: 'Too many email requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File upload rate limiter — 30 requests per 15 minutes
 */
export const uploadLimiter = rateLimit({
  windowMs: RATE_LIMITS.UPLOAD.windowMs,
  max: RATE_LIMITS.UPLOAD.max,
  message: {
    success: false,
    message: 'Too many upload requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
