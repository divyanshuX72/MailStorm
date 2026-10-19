/**
 * Authentication Service — Business Logic
 * Handles password hashing, JWT generation, token rotation, and password reset
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { userRepository } from '../repositories/user.repository';
import { AppError, getClientIp } from '../utils/helpers';
import { JwtPayload, TokenPair, RegisterInput, LoginInput } from '../types';
import prisma from '../config/database';
import { ACTIVITY, ENTITY } from '../utils/constants';
import logger from '../utils/logger';
import { User } from '@prisma/client';

const SALT_ROUNDS = 12;

class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput, req?: any): Promise<{ user: Partial<User>; tokens: TokenPair }> {
    // Check for existing user
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new AppError('A user with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create user
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      password: hashedPassword,
      phone: input.phone,
      company: input.company,
    });

    // Generate tokens
    const tokens = this.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token
    await userRepository.updateRefreshToken(user.id, tokens.refreshToken);

    // Log activity
    await this.logActivity(user.id, ACTIVITY.REGISTER, ENTITY.USER, user.id, req);

    logger.info(`User registered: ${user.email}`);

    // Return user without sensitive data
    const { password: _, refreshToken: __, resetToken: ___, resetTokenExp: ____, ...safeUser } = user;
    return { user: safeUser, tokens };
  }

  /**
   * Login with email and password
   */
  async login(input: LoginInput, req?: any): Promise<{ user: Partial<User>; tokens: TokenPair }> {
    // Find user
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const tokens = this.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token and update last login
    await Promise.all([
      userRepository.updateRefreshToken(user.id, tokens.refreshToken),
      userRepository.updateLastLogin(user.id),
    ]);

    // Log activity
    await this.logActivity(user.id, ACTIVITY.LOGIN, ENTITY.USER, user.id, req);

    logger.info(`User logged in: ${user.email}`);

    const { password: _, refreshToken: __, resetToken: ___, resetTokenExp: ____, ...safeUser } = user;
    return { user: safeUser, tokens };
  }

  /**
   * Logout — invalidate refresh token
   */
  async logout(userId: string, req?: any): Promise<void> {
    await userRepository.updateRefreshToken(userId, null);
    await this.logActivity(userId, ACTIVITY.LOGOUT, ENTITY.USER, userId, req);
    logger.info(`User logged out: ${userId}`);
  }

  /**
   * Refresh the access token using a valid refresh token
   * Implements token rotation: old refresh token is invalidated
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify the refresh token
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;

      // Find user and verify stored refresh token matches
      const user = await userRepository.findById(decoded.userId);
      if (!user || user.refreshToken !== refreshToken) {
        throw new AppError('Invalid refresh token', 401);
      }

      if (!user.isActive) {
        throw new AppError('Account deactivated', 403);
      }

      // Generate new token pair (rotation)
      const tokens = this.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Update stored refresh token
      await userRepository.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userRepository.update(userId, { password: hashedPassword });

    // Invalidate all sessions
    await userRepository.updateRefreshToken(userId, null);

    logger.info(`Password changed for user: ${userId}`);
  }

  /**
   * Initiate forgot password flow
   * Generates reset token and stores it (in production, send email with reset link)
   */
  async forgotPassword(email: string): Promise<string> {
    const user = await userRepository.findByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      return 'If an account with that email exists, a password reset link has been sent.';
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await userRepository.setResetToken(user.id, resetToken, resetTokenExp);

    // In production, send email with reset link:
    // const resetUrl = `${env.APP_URL}/reset-password?token=${resetToken}`;
    // await emailService.sendResetEmail(user.email, resetUrl);

    logger.info(`Password reset requested for: ${email}`, { resetToken });

    return 'If an account with that email exists, a password reset link has been sent.';
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await userRepository.findByResetToken(token);
    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and clear reset token
    await userRepository.update(user.id, { password: hashedPassword });
    await userRepository.clearResetToken(user.id);

    // Invalidate all sessions
    await userRepository.updateRefreshToken(user.id, null);

    logger.info(`Password reset completed for user: ${user.id}`);
  }

  /**
   * Get user profile (without sensitive data)
   */
  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { password, refreshToken, resetToken, resetTokenExp, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: { name?: string; phone?: string | null; company?: string | null }): Promise<Partial<User>> {
    const user = await userRepository.update(userId, data);
    const { password, refreshToken, resetToken, resetTokenExp, ...safeUser } = user;
    return safeUser;
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Generate JWT access and refresh token pair
   */
  private generateTokenPair(payload: JwtPayload): TokenPair {
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY as any,
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRY as any,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Log user activity
   */
  private async logActivity(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    req?: any
  ): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          userId,
          action,
          entity,
          entityId,
          ipAddress: req ? getClientIp(req) : null,
          userAgent: req?.headers?.['user-agent'] || null,
        },
      });
    } catch (error) {
      // Don't fail the main operation if logging fails
      logger.error('Failed to log activity', { error, action, entity });
    }
  }
}

export const authService = new AuthService();
