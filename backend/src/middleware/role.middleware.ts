/**
 * Role-Based Access Control Middleware
 * Restricts access based on user roles (ADMIN, USER)
 */

import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../utils/helpers';

/**
 * Create a middleware that requires specific role(s)
 * Usage: requireRole('ADMIN') or requireRole('ADMIN', 'USER')
 */
export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${roles.join(', ')}`,
          403
        )
      );
    }

    next();
  };
}

/**
 * Middleware to check if user is an admin
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Middleware to ensure the user can only access their own resources
 * Compares req.params.userId with the authenticated user's ID
 */
export function requireOwnership(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  // Admins can access any resource
  if (req.user.role === 'ADMIN') {
    return next();
  }

  const resourceUserId = req.params.userId;
  if (resourceUserId && resourceUserId !== req.user.userId) {
    return next(new AppError('Access denied. You can only access your own resources.', 403));
  }

  next();
}
