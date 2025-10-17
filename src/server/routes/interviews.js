import express from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all interviews for user
router.get('/', async (req, res) => {
  try {
    const { jobId, upcoming, completed } = req.query;

    const where = {
      job: {
        userId: req.user.id
      }
    };

    if (jobId) {
      where.jobId = jobId;
    }

    if (upcoming === 'true') {
      where.interviewDate = { gte: new Date() };
      where.completed = false;
    }

    if (completed === 'true') {
      where.completed = true;
    } else if (completed === 'false') {
      where.completed = false;
    }

    const interviews = await prisma.interview.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            companyName: true,
            jobTitle: true,
            stage: true
          }
        }
      },
      orderBy: { interviewDate: 'asc' }
    });

    res.json({ interviews });
  } catch (error) {
    logger.error('Get interviews error:', error);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// Get single interview
router.get('/:id', async (req, res) => {
  try {
    const interview = await prisma.interview.findFirst({
      where: {
        id: req.params.id,
        job: {
          userId: req.user.id
        }
      },
      include: {
        job: true
      }
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json({ interview });
  } catch (error) {
    logger.error('Get interview error:', error);
    res.status(500).json({ error: 'Failed to fetch interview' });
  }
});

// Create interview
router.post('/', async (req, res) => {
  try {
    const {
      jobId,
      interviewDate,
      interviewType,
      locationOrLink,
      interviewerName,
      interviewerEmail,
      duration,
      notes,
      preparationNotes
    } = req.body;

    if (!jobId || !interviewDate || !interviewType) {
      return res.status(400).json({
        error: 'Job ID, interview date, and interview type are required'
      });
    }

    // Verify job belongs to user
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId: req.user.id }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const interview = await prisma.interview.create({
      data: {
        jobId,
        interviewDate: new Date(interviewDate),
        interviewType,
        locationOrLink,
        interviewerName,
        interviewerEmail,
        duration: duration ? parseInt(duration) : null,
        notes,
        preparationNotes
      },
      include: {
        job: true
      }
    });

    // Create activity
    await prisma.activity.create({
      data: {
        jobId,
        activityType: 'INTERVIEW_SCHEDULED',
        description: `${interviewType} interview scheduled for ${new Date(interviewDate).toLocaleString()}`
      }
    });

    logger.info(`Interview created: ${interview.id} for job ${jobId}`);

    res.status(201).json({ interview });
  } catch (error) {
    logger.error('Create interview error:', error);
    res.status(500).json({ error: 'Failed to create interview' });
  }
});

// Update interview
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    delete updateData.id;
    delete updateData.jobId;
    delete updateData.createdAt;

    if (updateData.interviewDate) {
      updateData.interviewDate = new Date(updateData.interviewDate);
    }

    if (updateData.duration) {
      updateData.duration = parseInt(updateData.duration);
    }

    const interview = await prisma.interview.updateMany({
      where: {
        id,
        job: {
          userId: req.user.id
        }
      },
      data: updateData
    });

    if (interview.count === 0) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const updatedInterview = await prisma.interview.findUnique({
      where: { id },
      include: {
        job: true
      }
    });

    logger.info(`Interview updated: ${id}`);

    res.json({ interview: updatedInterview });
  } catch (error) {
    logger.error('Update interview error:', error);
    res.status(500).json({ error: 'Failed to update interview' });
  }
});

// Mark interview as completed
router.patch('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, notes } = req.body;

    const interview = await prisma.interview.findFirst({
      where: {
        id,
        job: {
          userId: req.user.id
        }
      }
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const updatedInterview = await prisma.interview.update({
      where: { id },
      data: {
        completed: true,
        rating: rating ? parseInt(rating) : null,
        notes: notes || interview.notes
      },
      include: {
        job: true
      }
    });

    // Create activity
    await prisma.activity.create({
      data: {
        jobId: interview.jobId,
        activityType: 'INTERVIEW_COMPLETED',
        description: `${interview.interviewType} interview completed`
      }
    });

    logger.info(`Interview marked complete: ${id}`);

    res.json({ interview: updatedInterview });
  } catch (error) {
    logger.error('Complete interview error:', error);
    res.status(500).json({ error: 'Failed to mark interview as complete' });
  }
});

// Delete interview
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const interview = await prisma.interview.deleteMany({
      where: {
        id,
        job: {
          userId: req.user.id
        }
      }
    });

    if (interview.count === 0) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    logger.info(`Interview deleted: ${id}`);

    res.json({ message: 'Interview deleted successfully' });
  } catch (error) {
    logger.error('Delete interview error:', error);
    res.status(500).json({ error: 'Failed to delete interview' });
  }
});

export default router;
