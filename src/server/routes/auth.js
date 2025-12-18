import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register with email/password
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true
      }
    });

    // Generate token
    const token = generateToken(user.id);

    // Set token as HttpOnly cookie for extension access
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none', // Required for Chrome extensions
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    logger.info(`User registered: ${email}`);

    res.status(201).json({
      user,
      token
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login with email/password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    // Set token as HttpOnly cookie for extension access
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none', // Required for Chrome extensions
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    logger.info(`User logged in: ${email}`);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      },
      token
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Google OAuth - Verify token and authenticate
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];
    const avatarUrl = payload['picture'];
    const emailVerified = payload['email_verified'];

    if (!emailVerified) {
      return res.status(400).json({ error: 'Email not verified by Google' });
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create new user with Google account
      user = await prisma.user.create({
        data: {
          email,
          name,
          avatarUrl,
          googleId,
          password: null // No password for Google OAuth users
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          googleId: true
        }
      });
      logger.info(`New user created via Google OAuth: ${email}`);
    } else if (!user.googleId) {
      // Link Google account to existing email/password user
      user = await prisma.user.update({
        where: { email },
        data: {
          googleId,
          avatarUrl: avatarUrl || user.avatarUrl
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          googleId: true
        }
      });
      logger.info(`Google account linked to existing user: ${email}`);
    } else {
      // User already exists with Google
      logger.info(`Existing Google user logged in: ${email}`);
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Set token as HttpOnly cookie for extension access
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none', // Required for Chrome extensions
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      },
      token
    });
  } catch (error) {
    logger.error('Google auth error:', error);

    // More specific error messages
    if (error.message?.includes('Token used too late')) {
      return res.status(401).json({ error: 'Google token expired' });
    }
    if (error.message?.includes('Invalid token')) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// Check authentication status (for extension)
router.get('/check', authenticateToken, (req, res) => {
  res.json({
    authenticated: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name
    }
  });
});

// Logout
router.post('/logout', (req, res) => {
  // Clear the auth cookie
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

export default router;
