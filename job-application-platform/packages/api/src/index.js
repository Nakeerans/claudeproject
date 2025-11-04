// JobFlow API Server
// Main entry point for the Express API

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== MIDDLEWARE ====================

// Security
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// ==================== ROUTES ====================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API v1 routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/profile', require('./routes/profile'));
app.use('/api/v1/applications', require('./routes/applications'));
app.use('/api/v1/recordings', require('./routes/recordings'));
app.use('/api/v1/patterns', require('./routes/patterns'));
app.use('/api/v1/ai', require('./routes/ai'));

// Extension-specific endpoints
app.use('/api/v1/extension', require('./routes/extension'));

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Don't leak error details in production
  const isDev = process.env.NODE_ENV !== 'production';

  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong',
    ...(isDev && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 JobFlow API Server');
  console.log('='.repeat(50));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log('='.repeat(50) + '\n');
  console.log('📚 Available endpoints:');
  console.log(`   GET  /health                      - Health check`);
  console.log(`   POST /api/v1/auth/*              - Authentication`);
  console.log(`   GET  /api/v1/profile             - User profile`);
  console.log(`   GET  /api/v1/applications        - Job applications`);
  console.log(`   POST /api/v1/recordings          - Save recordings`);
  console.log(`   GET  /api/v1/patterns            - Automation patterns`);
  console.log(`   POST /api/v1/ai/analyze          - AI pattern analysis`);
  console.log(`   GET  /api/v1/extension/profile   - Extension: Get profile`);
  console.log('='.repeat(50) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n📴 SIGTERM signal received: closing server gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n📴 SIGINT signal received: closing server gracefully');
  process.exit(0);
});

module.exports = app;
