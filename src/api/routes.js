import express from 'express';
import { logger } from '../utils/logger.js';

export const apiRouter = express.Router();

// AI Code Generation Endpoint
apiRouter.post('/generate-code', async (req, res) => {
  try {
    const { prompt, language, maxTokens } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const aiEngine = req.app.locals.aiEngine;
    const code = await aiEngine.generateCode(prompt, { maxTokens });

    res.json({
      success: true,
      code,
      language: language || 'javascript'
    });
  } catch (error) {
    logger.error('API: Code generation failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Code Validation Endpoint
apiRouter.post('/validate-code', async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const aiEngine = req.app.locals.aiEngine;
    const validation = await aiEngine.validateCode(code, language);

    res.json({
      success: true,
      validation
    });
  } catch (error) {
    logger.error('API: Code validation failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Test Generation Endpoint
apiRouter.post('/generate-tests', async (req, res) => {
  try {
    const { code, framework } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const aiEngine = req.app.locals.aiEngine;
    const tests = await aiEngine.generateTests(code, framework);

    res.json({
      success: true,
      tests
    });
  } catch (error) {
    logger.error('API: Test generation failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Web Scraping Endpoint
apiRouter.post('/scrape', async (req, res) => {
  try {
    const { url, selectors, dynamic, options } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const scraper = req.app.locals.webScraper;
    const method = dynamic ? 'scrapeDynamic' : 'scrapeStatic';
    const result = await scraper[method](url, { selectors, ...options });

    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('API: Scraping failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Workflow Execution Endpoint
apiRouter.post('/execute-workflow', async (req, res) => {
  try {
    const { workflowName, context } = req.body;

    if (!workflowName) {
      return res.status(400).json({ error: 'Workflow name is required' });
    }

    const orchestrator = req.app.locals.mcpOrchestrator;
    const result = await orchestrator.executeWorkflow(workflowName, context);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('API: Workflow execution failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// MCP Status Endpoint
apiRouter.get('/mcp/status', (req, res) => {
  try {
    const orchestrator = req.app.locals.mcpOrchestrator;
    const status = orchestrator.getStatus();

    res.json({
      success: true,
      status
    });
  } catch (error) {
    logger.error('API: MCP status failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});
