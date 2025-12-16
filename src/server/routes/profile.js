import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/profile
 * Get user's autofill profile
 */
router.get('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!profile) {
      // Return empty profile if not found
      return res.json({
        exists: false,
        profile: null
      });
    }

    res.json({
      exists: true,
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        linkedinUrl: profile.linkedinUrl,
        githubUrl: profile.githubUrl,
        portfolioUrl: profile.portfolioUrl,
        websiteUrl: profile.websiteUrl,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zipCode: profile.zipCode,
        country: profile.country,
        currentTitle: profile.currentTitle,
        yearsExperience: profile.yearsExperience,
        customFields: profile.customFields
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/profile
 * Create or update user's autofill profile
 */
router.put('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const {
      firstName,
      lastName,
      fullName,
      email,
      phone,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
      websiteUrl,
      address,
      city,
      state,
      zipCode,
      country,
      currentTitle,
      yearsExperience,
      customFields
    } = req.body;

    // Upsert profile (create or update)
    const profile = await prisma.userProfile.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        firstName,
        lastName,
        fullName,
        email,
        phone,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
        websiteUrl,
        address,
        city,
        state,
        zipCode,
        country,
        currentTitle,
        yearsExperience,
        customFields
      },
      update: {
        firstName,
        lastName,
        fullName,
        email,
        phone,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
        websiteUrl,
        address,
        city,
        state,
        zipCode,
        country,
        currentTitle,
        yearsExperience,
        customFields,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        linkedinUrl: profile.linkedinUrl,
        githubUrl: profile.githubUrl,
        portfolioUrl: profile.portfolioUrl,
        websiteUrl: profile.websiteUrl,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zipCode: profile.zipCode,
        country: profile.country,
        currentTitle: profile.currentTitle,
        yearsExperience: profile.yearsExperience,
        customFields: profile.customFields
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * DELETE /api/profile
 * Delete user's autofill profile
 */
router.delete('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    await prisma.userProfile.delete({
      where: { userId: req.user.id }
    });

    res.json({ success: true, message: 'Profile deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      // Profile doesn't exist
      return res.status(404).json({ error: 'Profile not found' });
    }
    console.error('Error deleting profile:', error);
    res.status(500).json({ error: 'Failed to delete profile' });
  }
});

export default router;
