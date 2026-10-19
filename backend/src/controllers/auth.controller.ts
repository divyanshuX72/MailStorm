/**
 * Auth Controller — Request Handlers
 * Handles HTTP requests for authentication endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/helpers';

class AuthController {
  /**
   * POST /api/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body, req);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      sendSuccess(res, {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      }, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body, req);

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      sendSuccess(res, {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) {
        await authService.logout(req.user.userId, req);
      }

      res.clearCookie('refreshToken');
      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh-token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.body.refreshToken || req.cookies?.refreshToken;

      if (!token) {
        res.status(401).json({ success: false, message: 'Refresh token is required' });
        return;
      }

      const tokens = await authService.refreshToken(token);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      sendSuccess(res, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const message = await authService.forgotPassword(req.body.email);
      sendSuccess(res, null, message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.resetPassword(req.body.token, req.body.password);
      sendSuccess(res, null, 'Password reset successfully. Please login with your new password.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/auth/change-password
   */
  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.changePassword(
        req.user!.userId,
        req.body.currentPassword,
        req.body.newPassword
      );
      sendSuccess(res, null, 'Password changed successfully. Please login again.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/profile
   */
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getProfile(req.user!.userId);
      sendSuccess(res, user, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/auth/profile
   */
  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.updateProfile(req.user!.userId, req.body);
      sendSuccess(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
