import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import fileUpload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';

import { logger } from '../utils/logger.js';
import authRoutes from './routes/auth.js';
import jobRoutes from './routes/jobs.js';
import contactRoutes from './routes/contacts.js';
import interviewRoutes from './routes/interviews.js';
import documentRoutes from './routes/documents.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/ai.js';
import profileRoutes from './routes/profile.js';
import patternsRoutes from './routes/patterns.js';
import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    logger.info('CORS request from origin:', origin);

    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) {
      return callback(null, true);
    }

    // Allow requests from web app
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'https://dusti.pro',
      'http://localhost:5173',
      'http://localhost:3000'
    ];

    // Allow browser extension origins
    if (origin.startsWith('chrome-extension://') ||
        origin.startsWith('edge-extension://') ||
        origin.startsWith('moz-extension://')) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'jobflow-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', authenticateToken, jobRoutes);
app.use('/api/contacts', authenticateToken, contactRoutes);
app.use('/api/interviews', authenticateToken, interviewRoutes);
app.use('/api/documents', authenticateToken, documentRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/profile', authenticateToken, profileRoutes);
app.use('/api/patterns', authenticateToken, patternsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'jobflow-api'
  });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error:', { error: err.message, stack: err.stack });
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 JobFlow server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

export default app;
