import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { Op } from 'sequelize';

const router = Router();
const { File } = db;

// Middleware to ensure user is authenticated
const requireAuth = (req: Request, res: Response, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Get all files for the authenticated user
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const tags = req.query.tags as string;
    let where: any = { userId };
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
  where.tags = { [Op.or]: tagArray.map(tag => ({ [Op.like]: `%${tag}%` })) };
    }
    const files = await File.findAll({ where, order: [['uploadedAt', 'DESC']] });
    // Convert tags from string to array for each file
  const filesWithTags = files.map(f => ({ ...f.toJSON(), tags: f.tags || [] }));
  res.json({ files: filesWithTags });
  } catch (error) {
    console.error('Error fetching user files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Create a new file record
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { name, originalName, type, size, s3Key, url, tags } = req.body;

    if (!name || !type || !size || !url) {
      return res.status(400).json({ error: 'Missing required file information' });
    }

    // Process tags - ensure they're lowercase and unique
    let processedTags: string[] = [];
    if (tags && Array.isArray(tags)) {
      processedTags = tags
        .map(tag => tag.toString().toLowerCase().trim())
        .filter(tag => tag.length > 0)
        .filter((tag, index, array) => array.indexOf(tag) === index); // Remove duplicates
    }

    const file = await File.create({
      userId,
      name,
      originalName: originalName || name,
      type,
      size,
      s3Key,
      url,
      tags: processedTags.length > 0 ? processedTags.join(',') : undefined,
      uploadedAt: new Date(),
      updatedAt: new Date()
    });
  res.status(201).json({ file: { ...file.toJSON(), tags: file.tags || [] } });
  } catch (error) {
    console.error('Error creating file record:', error);
    res.status(500).json({ error: 'Failed to create file record' });
  }
});

// Get a specific file by ID (only if it belongs to the user)
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const fileId = parseInt(req.params.id);

    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const file = await File.findOne({ where: { id: fileId, userId } });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
  res.json({ file: { ...file.toJSON(), tags: file.tags || [] } });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Delete a file
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const fileId = parseInt(req.params.id);

    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const file = await File.findOne({ where: { id: fileId, userId } });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    await file.destroy();
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Update file metadata
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const fileId = parseInt(req.params.id);
    const { name, tags } = req.body;

    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const file = await File.findOne({ where: { id: fileId, userId } });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    if (name) {
      file.name = name;
    }
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        const processedTags = tags
          .map(tag => tag.toString().toLowerCase().trim())
          .filter(tag => tag.length > 0)
          .filter((tag, index, array) => array.indexOf(tag) === index);
        file.tags = processedTags.length > 0 ? processedTags.join(',') : undefined;
      } else {
        file.tags = undefined;
      }
    }
    await file.save();
  res.json({ file: { ...file.toJSON(), tags: file.tags || [] } });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// Get all unique tags for the authenticated user
router.get('/tags/list', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const files = await File.findAll({ where: { userId } });
    const allTags = files
      .flatMap(file => file.tags || [])
      .map(tag => tag.toLowerCase())
      .filter((tag, index, array) => array.indexOf(tag) === index)
      .sort();
    res.json({ tags: allTags });
  } catch (error) {
    console.error('Error fetching user tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

export default router;
