import express from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all contacts for user
router.get('/', async (req, res) => {
  try {
    const { search, company } = req.query;

    const where = {
      userId: req.user.id
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (company) {
      where.company = { contains: company, mode: 'insensitive' };
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        jobs: {
          include: {
            job: {
              select: {
                id: true,
                companyName: true,
                jobTitle: true,
                stage: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ contacts });
  } catch (error) {
    logger.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Get single contact
router.get('/:id', async (req, res) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        jobs: {
          include: {
            job: true
          }
        }
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ contact });
  } catch (error) {
    logger.error('Get contact error:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// Create contact
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, linkedinUrl, company, role, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const contact = await prisma.contact.create({
      data: {
        userId: req.user.id,
        name,
        email,
        phone,
        linkedinUrl,
        company,
        role,
        notes
      }
    });

    logger.info(`Contact created: ${contact.id} by user ${req.user.id}`);

    res.status(201).json({ contact });
  } catch (error) {
    logger.error('Create contact error:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// Update contact
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;

    const contact = await prisma.contact.updateMany({
      where: {
        id,
        userId: req.user.id
      },
      data: updateData
    });

    if (contact.count === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const updatedContact = await prisma.contact.findUnique({
      where: { id },
      include: {
        jobs: {
          include: {
            job: true
          }
        }
      }
    });

    logger.info(`Contact updated: ${id}`);

    res.json({ contact: updatedContact });
  } catch (error) {
    logger.error('Update contact error:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// Delete contact
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.deleteMany({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (contact.count === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    logger.info(`Contact deleted: ${id}`);

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    logger.error('Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// Link contact to job
router.post('/:contactId/jobs/:jobId', async (req, res) => {
  try {
    const { contactId, jobId } = req.params;
    const { relationshipType = 'OTHER', notes } = req.body;

    // Verify job belongs to user
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId: req.user.id }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Verify contact belongs to user
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, userId: req.user.id }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Create relationship
    const jobContact = await prisma.jobContact.create({
      data: {
        jobId,
        contactId,
        relationshipType,
        notes
      },
      include: {
        contact: true,
        job: true
      }
    });

    logger.info(`Contact ${contactId} linked to job ${jobId}`);

    res.status(201).json({ jobContact });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Contact already linked to this job' });
    }
    logger.error('Link contact to job error:', error);
    res.status(500).json({ error: 'Failed to link contact to job' });
  }
});

// Unlink contact from job
router.delete('/:contactId/jobs/:jobId', async (req, res) => {
  try {
    const { contactId, jobId } = req.params;

    // Verify job belongs to user
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId: req.user.id }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await prisma.jobContact.delete({
      where: {
        jobId_contactId: {
          jobId,
          contactId
        }
      }
    });

    logger.info(`Contact ${contactId} unlinked from job ${jobId}`);

    res.json({ message: 'Contact unlinked from job successfully' });
  } catch (error) {
    logger.error('Unlink contact from job error:', error);
    res.status(500).json({ error: 'Failed to unlink contact from job' });
  }
});

export default router;
