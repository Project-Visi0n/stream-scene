import { Router, Request, Response } from 'express';
import { db } from '../db/index';

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
    const files = await File.findAllByUserId(userId);
    res.json({ files });
  } catch (error) {
    console.error('Error fetching user files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Create a new file record
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { name, originalName, type, size, s3Key, url } = req.body;

    if (!name || !type || !size || !url) {
      return res.status(400).json({ error: 'Missing required file information' });
    }

    const file = await File.create({
      userId,
      name,
      originalName: originalName || name,
      type,
      size,
      s3Key,
      url
    });

    res.status(201).json({ file });
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

    const file = await File.findByIdAndUserId(fileId, userId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({ file });
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

    const file = await File.findByIdAndUserId(fileId, userId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete the file record
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
    const { name } = req.body;

    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const file = await File.findByIdAndUserId(fileId, userId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Update allowed fields
    if (name) {
      file.name = name;
    }

    await file.save();

    res.json({ file });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

export default router;
