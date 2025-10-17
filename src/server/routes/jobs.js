import express from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all jobs for user
router.get('/', async (req, res) => {
  try {
    const { stage, search, sortBy = 'createdAt', order = 'desc' } = req.query;

    const where = {
      userId: req.user.id,
      ...(stage && { stage })
    };

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        contacts: {
          include: {
            contact: true
          }
        },
        interviews: {
          where: { completed: false },
          orderBy: { interviewDate: 'asc' }
        },
        _count: {
          select: {
            documents: true,
            activities: true
          }
        }
      },
      orderBy: {
        [sortBy]: order
      }
    });

    res.json({ jobs });
  } catch (error) {
    logger.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get single job
router.get('/:id', async (req, res) => {
  try {
    const job = await prisma.job.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        contacts: {
          include: {
            contact: true
          }
        },
        interviews: {
          orderBy: { interviewDate: 'asc' }
        },
        documents: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });
  } catch (error) {
    logger.error('Get job error:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Create job
router.post('/', async (req, res) => {
  try {
    const {
      companyName,
      jobTitle,
      location,
      jobUrl,
      description,
      salaryMin,
      salaryMax,
      stage = 'WISHLIST',
      priority,
      appliedDate,
      deadline,
      notes,
      color
    } = req.body;

    if (!companyName || !jobTitle) {
      return res.status(400).json({ error: 'Company name and job title are required' });
    }

    const job = await prisma.job.create({
      data: {
        userId: req.user.id,
        companyName,
        jobTitle,
        location,
        jobUrl,
        description,
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        stage,
        priority: priority ? parseInt(priority) : 3,
        appliedDate: appliedDate ? new Date(appliedDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        notes,
        color: color || '#6a4feb'
      },
      include: {
        contacts: {
          include: {
            contact: true
          }
        },
        interviews: true
      }
    });

    // Create activity
    await prisma.activity.create({
      data: {
        jobId: job.id,
        activityType: 'JOB_CREATED',
        description: `Created job application for ${jobTitle} at ${companyName}`
      }
    });

    logger.info(`Job created: ${job.id} by user ${req.user.id}`);

    res.status(201).json({ job });
  } catch (error) {
    logger.error('Create job error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Update job
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;

    // Convert dates if present
    if (updateData.appliedDate) {
      updateData.appliedDate = new Date(updateData.appliedDate);
    }
    if (updateData.deadline) {
      updateData.deadline = new Date(updateData.deadline);
    }

    // Convert numbers if present
    if (updateData.salaryMin) {
      updateData.salaryMin = parseInt(updateData.salaryMin);
    }
    if (updateData.salaryMax) {
      updateData.salaryMax = parseInt(updateData.salaryMax);
    }
    if (updateData.priority) {
      updateData.priority = parseInt(updateData.priority);
    }

    const job = await prisma.job.updateMany({
      where: {
        id,
        userId: req.user.id
      },
      data: updateData
    });

    if (job.count === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get updated job
    const updatedJob = await prisma.job.findUnique({
      where: { id },
      include: {
        contacts: {
          include: {
            contact: true
          }
        },
        interviews: true
      }
    });

    // Create activity
    await prisma.activity.create({
      data: {
        jobId: id,
        activityType: 'JOB_UPDATED',
        description: 'Job details updated'
      }
    });

    logger.info(`Job updated: ${id}`);

    res.json({ job: updatedJob });
  } catch (error) {
    logger.error('Update job error:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Update job stage (for drag-and-drop)
router.patch('/:id/stage', async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    if (!stage) {
      return res.status(400).json({ error: 'Stage is required' });
    }

    const job = await prisma.job.updateMany({
      where: {
        id,
        userId: req.user.id
      },
      data: { stage }
    });

    if (job.count === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Create activity
    await prisma.activity.create({
      data: {
        jobId: id,
        activityType: 'STAGE_CHANGED',
        description: `Stage changed to ${stage}`
      }
    });

    const updatedJob = await prisma.job.findUnique({
      where: { id }
    });

    logger.info(`Job stage updated: ${id} -> ${stage}`);

    res.json({ job: updatedJob });
  } catch (error) {
    logger.error('Update job stage error:', error);
    res.status(500).json({ error: 'Failed to update job stage' });
  }
});

// Delete job
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.deleteMany({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (job.count === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    logger.info(`Job deleted: ${id}`);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    logger.error('Delete job error:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

export default router;
