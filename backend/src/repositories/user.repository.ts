/**
 * User Repository — Database Access Layer
 * All user-related database operations
 */

import prisma from '../config/database';
import { Prisma, User } from '@prisma/client';

export class UserRepository {
  /**
   * Create a new user
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  /**
   * Find user by reset token
   */
  async findByResetToken(resetToken: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        resetToken,
        resetTokenExp: { gt: new Date() },
      },
    });
  }

  /**
   * Update user
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  /**
   * Update refresh token
   */
  async updateRefreshToken(id: string, refreshToken: string | null): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { refreshToken },
    });
  }

  /**
   * Set reset password token
   */
  async setResetToken(id: string, resetToken: string, resetTokenExp: Date): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { resetToken, resetTokenExp },
    });
  }

  /**
   * Clear reset token after successful password reset
   */
  async clearResetToken(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { resetToken: null, resetTokenExp: null },
    });
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * Get all users with pagination (Admin only)
   */
  async findAll(params: {
    skip: number;
    take: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }) {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          phone: true,
          company: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          // Exclude password and tokens
        },
      }),
      prisma.user.count({ where: params.where }),
    ]);

    return { users, total };
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<User> {
    return prisma.user.delete({ where: { id } });
  }

  /**
   * Count users
   */
  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return prisma.user.count({ where });
  }
}

export const userRepository = new UserRepository();
