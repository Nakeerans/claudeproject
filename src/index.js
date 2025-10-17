import express from 'express';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { AIEngine } from './ai-engine/engine.js';
import { MCPOrchestrator } from './mcp/orchestrator.js';
import { WebScraper } from './scraper/scraper.js';
import { apiRouter } from './api/routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize core modules
const aiEngine = new AIEngine();
const mcpOrchestrator = new MCPOrchestrator(aiEngine);
const webScraper = new WebScraper();

// Make modules available to routes
app.locals.aiEngine = aiEngine;
app.locals.mcpOrchestrator = mcpOrchestrator;
app.locals.webScraper = webScraper;

// API Routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    modules: {
      aiEngine: aiEngine.isReady(),
      mcp: mcpOrchestrator.isReady(),
      scraper: webScraper.isReady()
    }
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Autonomous AI System running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await mcpOrchestrator.shutdown();
  process.exit(0);
});

export { app, aiEngine, mcpOrchestrator, webScraper };
