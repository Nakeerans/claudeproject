import express from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;

    // Total jobs by stage
    const jobsByStage = await prisma.job.groupBy({
      by: ['stage'],
      where: { userId },
      _count: true
    });

    // Total jobs
    const totalJobs = await prisma.job.count({
      where: { userId }
    });

    // Applications this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const applicationsThisMonth = await prisma.job.count({
      where: {
        userId,
        appliedDate: {
          gte: firstDayOfMonth
        }
      }
    });

    // Upcoming interviews
    const upcomingInterviews = await prisma.interview.count({
      where: {
        job: { userId },
        interviewDate: { gte: new Date() },
        completed: false
      }
    });

    // Offers received
    const offersCount = await prisma.job.count({
      where: {
        userId,
        stage: 'OFFER'
      }
    });

    // Response rate (interviews / applications)
    const applicationsCount = await prisma.job.count({
      where: {
        userId,
        stage: { in: ['APPLIED', 'INTERVIEW', 'OFFER'] }
      }
    });

    const interviewsCount = await prisma.job.count({
      where: {
        userId,
        stage: { in: ['INTERVIEW', 'OFFER'] }
      }
    });

    const responseRate = applicationsCount > 0
      ? Math.round((interviewsCount / applicationsCount) * 100)
      : 0;

    // Format stages for frontend
    const stageStats = {
      WISHLIST: 0,
      APPLIED: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0
    };

    jobsByStage.forEach(stage => {
      stageStats[stage.stage] = stage._count;
    });

    res.json({
      totalJobs,
      applicationsThisMonth,
      upcomingInterviews,
      offersCount,
      responseRate,
      jobsByStage: stageStats
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get applications timeline
router.get('/timeline', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user.id;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    // Get jobs created in the time period
    const jobs = await prisma.job.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true,
        stage: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by date
    const timeline = {};
    jobs.forEach(job => {
      const date = job.createdAt.toISOString().split('T')[0];
      if (!timeline[date]) {
        timeline[date] = {
          date,
          total: 0,
          wishlist: 0,
          applied: 0,
          interview: 0,
          offer: 0,
          rejected: 0
        };
      }
      timeline[date].total++;
      timeline[date][job.stage.toLowerCase()]++;
    });

    // Convert to array and fill missing dates
    const timelineArray = [];
    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      timelineArray.push(timeline[dateStr] || {
        date: dateStr,
        total: 0,
        wishlist: 0,
        applied: 0,
        interview: 0,
        offer: 0,
        rejected: 0
      });
    }

    res.json({ timeline: timelineArray });
  } catch (error) {
    logger.error('Get timeline error:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

// Get recent activities
router.get('/activities', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const userId = req.user.id;

    const activities = await prisma.activity.findMany({
      where: {
        job: { userId }
      },
      include: {
        job: {
          select: {
            id: true,
            companyName: true,
            jobTitle: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({ activities });
  } catch (error) {
    logger.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get job application funnel
router.get('/funnel', async (req, res) => {
  try {
    const userId = req.user.id;

    const wishlist = await prisma.job.count({
      where: { userId, stage: 'WISHLIST' }
    });

    const applied = await prisma.job.count({
      where: { userId, stage: 'APPLIED' }
    });

    const interview = await prisma.job.count({
      where: { userId, stage: 'INTERVIEW' }
    });

    const offer = await prisma.job.count({
      where: { userId, stage: 'OFFER' }
    });

    const rejected = await prisma.job.count({
      where: { userId, stage: 'REJECTED' }
    });

    res.json({
      funnel: [
        { stage: 'Wishlist', count: wishlist },
        { stage: 'Applied', count: applied },
        { stage: 'Interview', count: interview },
        { stage: 'Offer', count: offer },
        { stage: 'Rejected', count: rejected }
      ]
    });
  } catch (error) {
    logger.error('Get funnel error:', error);
    res.status(500).json({ error: 'Failed to fetch funnel data' });
  }
});

// Get top companies (most applications)
router.get('/top-companies', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.id;

    const companies = await prisma.job.groupBy({
      by: ['companyName'],
      where: { userId },
      _count: true,
      orderBy: {
        _count: {
          companyName: 'desc'
        }
      },
      take: parseInt(limit)
    });

    res.json({
      topCompanies: companies.map(c => ({
        company: c.companyName,
        count: c._count
      }))
    });
  } catch (error) {
    logger.error('Get top companies error:', error);
    res.status(500).json({ error: 'Failed to fetch top companies' });
  }
});

// Get average time in each stage
router.get('/time-in-stage', async (req, res) => {
  try {
    const userId = req.user.id;

    // This is a complex query - simplified version
    // In production, you'd track stage transitions separately

    const jobs = await prisma.job.findMany({
      where: { userId },
      select: {
        stage: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const avgTimeByStage = {
      WISHLIST: 0,
      APPLIED: 0,
      INTERVIEW: 0,
      OFFER: 0
    };

    // Calculate average days (simplified - would need stage transition tracking)
    jobs.forEach(job => {
      const days = Math.floor(
        (job.updatedAt - job.createdAt) / (1000 * 60 * 60 * 24)
      );
      if (avgTimeByStage[job.stage] !== undefined) {
        avgTimeByStage[job.stage] += days;
      }
    });

    // Average it out
    Object.keys(avgTimeByStage).forEach(stage => {
      const count = jobs.filter(j => j.stage === stage).length;
      if (count > 0) {
        avgTimeByStage[stage] = Math.round(avgTimeByStage[stage] / count);
      }
    });

    res.json({ avgTimeByStage });
  } catch (error) {
    logger.error('Get time in stage error:', error);
    res.status(500).json({ error: 'Failed to fetch time in stage data' });
  }
});

export default router;
