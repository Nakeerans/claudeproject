import express from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { logger } from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get all documents for user
router.get('/', async (req, res) => {
  try {
    const { jobId, documentType } = req.query;

    const where = {
      userId: req.user.id
    };

    if (jobId) {
      where.jobId = jobId;
    }

    if (documentType) {
      where.documentType = documentType;
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            companyName: true,
            jobTitle: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ documents });
  } catch (error) {
    logger.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get single document
router.get('/:id', async (req, res) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        job: true
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    logger.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Upload document
router.post('/upload', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { jobId, documentType = 'OTHER', notes } = req.body;
    const file = req.files.file;

    // Create user directory
    const userDir = path.join(uploadsDir, req.user.id);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.name);
    const filename = `${timestamp}_${file.name}`;
    const filePath = path.join(userDir, filename);

    // Move file
    await file.mv(filePath);

    // Save to database
    const document = await prisma.document.create({
      data: {
        userId: req.user.id,
        jobId: jobId || null,
        fileName: file.name,
        fileType: file.mimetype,
        fileUrl: `/uploads/${req.user.id}/${filename}`,
        fileSize: file.size,
        documentType,
        notes
      },
      include: {
        job: jobId ? {
          select: {
            id: true,
            companyName: true,
            jobTitle: true
          }
        } : undefined
      }
    });

    // Create activity if linked to job
    if (jobId) {
      await prisma.activity.create({
        data: {
          jobId,
          activityType: 'DOCUMENT_UPLOADED',
          description: `Uploaded ${documentType.toLowerCase()}: ${file.name}`
        }
      });
    }

    logger.info(`Document uploaded: ${document.id} by user ${req.user.id}`);

    res.status(201).json({ document });
  } catch (error) {
    logger.error('Upload document error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Update document metadata
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { documentType, notes, jobId } = req.body;

    const updateData = {};
    if (documentType) updateData.documentType = documentType;
    if (notes !== undefined) updateData.notes = notes;
    if (jobId !== undefined) updateData.jobId = jobId || null;

    const document = await prisma.document.updateMany({
      where: {
        id,
        userId: req.user.id
      },
      data: updateData
    });

    if (document.count === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const updatedDocument = await prisma.document.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            companyName: true,
            jobTitle: true
          }
        }
      }
    });

    logger.info(`Document updated: ${id}`);

    res.json({ document: updatedDocument });
  } catch (error) {
    logger.error('Update document error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Download document
router.get('/:id/download', async (req, res) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join(__dirname, '../../..', document.fileUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(filePath, document.fileName);
  } catch (error) {
    logger.error('Download document error:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../..', document.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.document.delete({
      where: { id }
    });

    logger.info(`Document deleted: ${id}`);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    logger.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
