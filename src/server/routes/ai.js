import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

// Generate Resume
router.post('/generate-resume', async (req, res) => {
  try {
    const { userInfo, targetJob, style = 'professional' } = req.body;

    if (!userInfo || !userInfo.name) {
      return res.status(400).json({ error: 'User information is required' });
    }

    // Build comprehensive prompt
    const prompt = `You are an expert resume writer. Create a professional resume based on the following information:

**Personal Information:**
Name: ${userInfo.name}
Email: ${userInfo.email || 'N/A'}
Phone: ${userInfo.phone || 'N/A'}
Location: ${userInfo.location || 'N/A'}
LinkedIn: ${userInfo.linkedinUrl || 'N/A'}

**Professional Summary:**
${userInfo.summary || 'Create a compelling professional summary based on the experience below.'}

**Work Experience:**
${userInfo.experience ? userInfo.experience.map(exp => `
- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})
  ${exp.description || ''}
`).join('\n') : 'No experience provided'}

**Education:**
${userInfo.education ? userInfo.education.map(edu => `
- ${edu.degree} in ${edu.field} from ${edu.school} (${edu.year})
`).join('\n') : 'No education provided'}

**Skills:**
${userInfo.skills ? userInfo.skills.join(', ') : 'No skills provided'}

**Target Job (if provided):**
${targetJob ? `
Company: ${targetJob.companyName}
Position: ${targetJob.jobTitle}
Description: ${targetJob.description || 'N/A'}
` : 'No specific target job'}

**Style Preference:** ${style}

Please generate a ${style} resume in Markdown format with the following sections:
1. Professional Summary
2. Work Experience
3. Education
4. Skills
5. Optional: Certifications, Projects, or Achievements (if applicable)

Make it ATS-friendly, use action verbs, quantify achievements where possible, and tailor it${targetJob ? ' to the target job' : ''}.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const resumeContent = message.content[0].text;

    // Log the generation
    logger.info(`Resume generated for user ${req.user.id}`);

    res.json({
      resume: resumeContent,
      format: 'markdown',
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Generate resume error:', error);

    if (error.message?.includes('API key')) {
      return res.status(500).json({
        error: 'AI service not configured. Please set ANTHROPIC_API_KEY environment variable.'
      });
    }

    res.status(500).json({ error: 'Failed to generate resume' });
  }
});

// Generate Cover Letter
router.post('/generate-cover-letter', async (req, res) => {
  try {
    const { userInfo, job, tone = 'professional' } = req.body;

    if (!job || !job.companyName || !job.jobTitle) {
      return res.status(400).json({ error: 'Job information is required' });
    }

    if (!userInfo || !userInfo.name) {
      return res.status(400).json({ error: 'User information is required' });
    }

    const prompt = `You are an expert cover letter writer. Write a compelling cover letter for the following job application:

**Applicant Information:**
Name: ${userInfo.name}
Email: ${userInfo.email || 'N/A'}
Phone: ${userInfo.phone || 'N/A'}
Current Role: ${userInfo.currentRole || 'N/A'}

**Background:**
${userInfo.summary || userInfo.experience?.[0]?.description || 'Experienced professional'}

**Key Skills:**
${userInfo.skills ? userInfo.skills.join(', ') : 'N/A'}

**Target Job:**
Company: ${job.companyName}
Position: ${job.jobTitle}
Location: ${job.location || 'N/A'}

**Job Description:**
${job.description || 'No description provided'}

**Additional Context:**
${userInfo.whyInterested || 'Express genuine interest in the company and role'}

**Tone:** ${tone}

Write a ${tone} cover letter that:
1. Opens with a strong hook that shows genuine interest
2. Highlights 2-3 relevant achievements or skills that match the job requirements
3. Shows knowledge of the company and explains why you're a great fit
4. Closes with a call to action
5. Is 3-4 paragraphs long
6. Uses specific examples and quantifiable results where possible

Format the letter professionally with proper salutation and closing.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const coverLetterContent = message.content[0].text;

    // Log the generation
    logger.info(`Cover letter generated for user ${req.user.id} for job at ${job.companyName}`);

    res.json({
      coverLetter: coverLetterContent,
      format: 'text',
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Generate cover letter error:', error);

    if (error.message?.includes('API key')) {
      return res.status(500).json({
        error: 'AI service not configured. Please set ANTHROPIC_API_KEY environment variable.'
      });
    }

    res.status(500).json({ error: 'Failed to generate cover letter' });
  }
});

// Analyze Job Description
router.post('/analyze-job', async (req, res) => {
  try {
    const { jobDescription, userSkills = [] } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const prompt = `You are a job analysis expert. Analyze the following job description and provide insights:

**Job Description:**
${jobDescription}

**User's Current Skills:**
${userSkills.length > 0 ? userSkills.join(', ') : 'Not provided'}

Please analyze and provide:

1. **Key Requirements:** List the top 5-7 must-have skills/qualifications
2. **Nice-to-Have:** List 3-5 preferred but not required qualifications
3. **Experience Level:** Estimate the required experience level (Entry/Mid/Senior)
4. **Skill Match:** ${userSkills.length > 0 ? 'Compare user skills against requirements and provide a match percentage' : 'N/A'}
5. **Red Flags:** Any concerning requirements or unclear expectations
6. **Missing Skills:** ${userSkills.length > 0 ? 'Skills from the job description that the user should develop' : 'N/A'}
7. **Application Tips:** 3-4 specific tips for applying to this role

Format the response as a structured JSON object with these sections.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const analysisText = message.content[0].text;

    // Try to parse as JSON, fallback to text
    let analysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) ||
                       analysisText.match(/```\n([\s\S]*?)\n```/);

      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        analysis = JSON.parse(analysisText);
      }
    } catch (e) {
      // If not valid JSON, return as formatted text
      analysis = { rawAnalysis: analysisText };
    }

    logger.info(`Job description analyzed for user ${req.user.id}`);

    res.json({
      analysis,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Analyze job error:', error);

    if (error.message?.includes('API key')) {
      return res.status(500).json({
        error: 'AI service not configured. Please set ANTHROPIC_API_KEY environment variable.'
      });
    }

    res.status(500).json({ error: 'Failed to analyze job description' });
  }
});

// Improve Resume Section
router.post('/improve-resume-section', async (req, res) => {
  try {
    const { section, content, targetRole } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const prompt = `You are a professional resume writer. Improve the following ${section || 'resume section'}:

**Current Content:**
${content}

${targetRole ? `**Target Role:** ${targetRole}` : ''}

Please rewrite this section to:
1. Use strong action verbs
2. Include quantifiable achievements where possible
3. Be concise and impactful
4. Make it ATS-friendly
5. ${targetRole ? 'Tailor it to the target role' : 'Make it more professional'}

Provide the improved version and a brief explanation of the changes made.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const improvedContent = message.content[0].text;

    res.json({
      improved: improvedContent,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Improve resume section error:', error);

    if (error.message?.includes('API key')) {
      return res.status(500).json({
        error: 'AI service not configured. Please set ANTHROPIC_API_KEY environment variable.'
      });
    }

    res.status(500).json({ error: 'Failed to improve resume section' });
  }
});

// Generate Interview Preparation
router.post('/interview-prep', async (req, res) => {
  try {
    const { job, userBackground } = req.body;

    if (!job || !job.companyName || !job.jobTitle) {
      return res.status(400).json({ error: 'Job information is required' });
    }

    const prompt = `You are an interview preparation expert. Generate comprehensive interview preparation materials for:

**Job Details:**
Company: ${job.companyName}
Position: ${job.jobTitle}
Description: ${job.description || 'N/A'}

**Candidate Background:**
${userBackground || 'Not provided'}

Please provide:

1. **Common Interview Questions** (8-10 questions likely to be asked)
2. **Behavioral Questions** (5-7 STAR method questions)
3. **Technical Questions** (if applicable, 5-7 questions)
4. **Questions to Ask** (5-7 insightful questions to ask the interviewer)
5. **Key Talking Points** (3-5 achievements or experiences to highlight)
6. **Company Research Tips** (what to research about ${job.companyName})
7. **Red Flags to Watch For** (things to assess about the role/company)

Format as a structured, easy-to-read guide.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const prepContent = message.content[0].text;

    logger.info(`Interview prep generated for user ${req.user.id} for ${job.companyName}`);

    res.json({
      preparation: prepContent,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Interview prep error:', error);

    if (error.message?.includes('API key')) {
      return res.status(500).json({
        error: 'AI service not configured. Please set ANTHROPIC_API_KEY environment variable.'
      });
    }

    res.status(500).json({ error: 'Failed to generate interview preparation' });
  }
});

export default router;
