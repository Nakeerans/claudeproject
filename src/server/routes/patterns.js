import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/patterns
 * Get user's autofill patterns, optionally filtered by site URL
 */
router.get('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { url } = req.query;

    // Build query filters
    const where = { userId: req.user.id };

    if (url) {
      // Extract base domain from URL for matching
      const baseDomain = new URL(url).hostname.replace('www.', '');
      where.siteUrl = {
        contains: baseDomain
      };
    }

    const patterns = await prisma.autofillPattern.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      patterns: patterns.map(p => ({
        id: p.id,
        siteUrl: p.siteUrl,
        siteName: p.siteName,
        actions: p.actions,
        fieldMappings: p.fieldMappings,
        timesUsed: p.timesUsed,
        successRate: p.successRate,
        recordedAt: p.recordedAt,
        updatedAt: p.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching patterns:', error);
    res.status(500).json({ error: 'Failed to fetch patterns' });
  }
});

/**
 * GET /api/patterns/:id
 * Get a specific autofill pattern by ID
 */
router.get('/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const pattern = await prisma.autofillPattern.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!pattern) {
      return res.status(404).json({ error: 'Pattern not found' });
    }

    res.json({
      pattern: {
        id: pattern.id,
        siteUrl: pattern.siteUrl,
        siteName: pattern.siteName,
        actions: pattern.actions,
        fieldMappings: pattern.fieldMappings,
        timesUsed: pattern.timesUsed,
        successRate: pattern.successRate,
        recordedAt: pattern.recordedAt,
        updatedAt: pattern.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching pattern:', error);
    res.status(500).json({ error: 'Failed to fetch pattern' });
  }
});

/**
 * POST /api/patterns
 * Save a new autofill pattern (from learning mode)
 */
router.post('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { siteUrl, siteName, actions, fieldMappings } = req.body;

    // Validate required fields
    if (!siteUrl || !actions || !fieldMappings) {
      return res.status(400).json({
        error: 'Missing required fields: siteUrl, actions, fieldMappings'
      });
    }

    // Extract base domain from URL
    const baseDomain = new URL(siteUrl).hostname.replace('www.', '');

    // Check if pattern already exists for this site
    const existingPattern = await prisma.autofillPattern.findFirst({
      where: {
        userId: req.user.id,
        siteUrl: {
          contains: baseDomain
        }
      }
    });

    let pattern;

    if (existingPattern) {
      // Update existing pattern
      pattern = await prisma.autofillPattern.update({
        where: { id: existingPattern.id },
        data: {
          siteName: siteName || existingPattern.siteName,
          actions,
          fieldMappings,
          recordedAt: new Date(),
          updatedAt: new Date()
        }
      });
    } else {
      // Create new pattern
      pattern = await prisma.autofillPattern.create({
        data: {
          userId: req.user.id,
          siteUrl: baseDomain,
          siteName: siteName || baseDomain,
          actions,
          fieldMappings,
          recordedAt: new Date()
        }
      });
    }

    res.json({
      success: true,
      pattern: {
        id: pattern.id,
        siteUrl: pattern.siteUrl,
        siteName: pattern.siteName,
        actions: pattern.actions,
        fieldMappings: pattern.fieldMappings,
        timesUsed: pattern.timesUsed,
        successRate: pattern.successRate,
        recordedAt: pattern.recordedAt
      },
      isNew: !existingPattern
    });
  } catch (error) {
    console.error('Error saving pattern:', error);
    res.status(500).json({ error: 'Failed to save pattern' });
  }
});

/**
 * PUT /api/patterns/:id/stats
 * Update pattern usage statistics
 */
router.put('/:id/stats', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { success } = req.body;

    // Get current pattern
    const pattern = await prisma.autofillPattern.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!pattern) {
      return res.status(404).json({ error: 'Pattern not found' });
    }

    // Calculate new success rate
    const totalUses = pattern.timesUsed + 1;
    const currentSuccesses = pattern.successRate
      ? Math.round(pattern.successRate * pattern.timesUsed)
      : 0;
    const newSuccesses = currentSuccesses + (success ? 1 : 0);
    const newSuccessRate = newSuccesses / totalUses;

    // Update pattern
    const updatedPattern = await prisma.autofillPattern.update({
      where: { id: req.params.id },
      data: {
        timesUsed: totalUses,
        successRate: newSuccessRate,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      pattern: {
        id: updatedPattern.id,
        timesUsed: updatedPattern.timesUsed,
        successRate: updatedPattern.successRate
      }
    });
  } catch (error) {
    console.error('Error updating pattern stats:', error);
    res.status(500).json({ error: 'Failed to update pattern stats' });
  }
});

/**
 * DELETE /api/patterns/:id
 * Delete an autofill pattern
 */
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    await prisma.autofillPattern.delete({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    res.json({ success: true, message: 'Pattern deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Pattern not found' });
    }
    console.error('Error deleting pattern:', error);
    res.status(500).json({ error: 'Failed to delete pattern' });
  }
});

export default router;
