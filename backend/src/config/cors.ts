/**
 * CORS Configuration
 * Controls which origins, methods, and headers are allowed
 */

import cors from 'cors';
import { env } from './env';

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      ...env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      'http://127.0.0.1:5173',
      'http://localhost:5173'
    ];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'],
  maxAge: 86400, // 24 hours
};
