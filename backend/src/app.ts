/**
 * Express Application Configuration
 * Wires all middleware, routes, and error handling
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';

import { corsOptions } from './config/cors';
import { generalLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import routes from './routes';
import { env } from './config/env';

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet — sets security-related HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — cross-origin resource sharing
app.use(cors(corsOptions));

// Rate limiting — general API protection
app.use('/api', generalLimiter);

// ============================================
// PARSING MIDDLEWARE
// ============================================

// JSON body parser
app.use(express.json({ limit: '10mb' }));

// URL-encoded form data parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser (for refresh token cookie)
app.use(cookieParser());

// ============================================
// LOGGING
// ============================================

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.LOG_LEVEL));
}

// ============================================
// STATIC FILES
// ============================================

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ============================================
// API ROUTES
// ============================================

app.use('/api', routes);

// ============================================
// 404 HANDLER
// ============================================

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use(errorHandler);

export default app;
