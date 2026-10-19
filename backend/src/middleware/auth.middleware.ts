/**
 * Authentication Middleware
 * Verifies JWT access tokens and injects user data into requests
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticatedRequest, JwtPayload } from '../types';
import { AppError } from '../utils/helpers';

/**
 * Verify the access token from the Authorization header
 * Format: Bearer <token>
 */
export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token is required', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Access token is required', 401);
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Access token has expired', 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid access token', 401));
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
}

/**
 * Optional authentication — doesn't fail if no token present
 * Useful for endpoints that work for both authenticated and anonymous users
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      }
    }

    next();
  } catch {
    // Silently continue without auth
    next();
  }
}
