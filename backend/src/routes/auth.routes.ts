/**
 * Auth Routes
 * All authentication-related API endpoints
 */

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { authLimiter } from '../middleware/rateLimiter.middleware';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../validators/auth.validator';

const router = Router();

// Public routes (with rate limiting)
router.post('/register', authLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, validateBody(updateProfileSchema), authController.updateProfile);
router.put('/change-password', authenticate, validateBody(changePasswordSchema), authController.changePassword);

export default router;
