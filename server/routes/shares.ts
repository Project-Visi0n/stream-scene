import { Router, Request, Response } from 'express';
import { db } from '../db/index';

const router = Router();
const { File, Share } = db;

// Helper function to get the correct base URL for share links
const getBaseUrl = (req: Request): string => {
  const protocol = req.protocol;
  const host = req.get('host');
  
  // Use the same host and port for share links
  return `${protocol}://${host}`;
};

// Middleware to ensure user is authenticated
const requireAuth = (req: Request, res: Response, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Create a new share for a file
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { fileId, shareType, expiresAt } = req.body;

    // Validate input
    if (!fileId || !shareType) {
      return res.status(400).json({ error: 'Missing required share information' });
    }

    if (!['one-time', 'indefinite'].includes(shareType)) {
      return res.status(400).json({ error: 'Invalid share type. Must be "one-time" or "indefinite"' });
    }

    // Verify file exists and belongs to user
    const file = await File.findByIdAndUserId(fileId, userId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Create the share
    const shareData: any = {
      fileId,
      userId,
      shareType
    };

    // Handle expiration date if provided
    if (expiresAt) {
      const expDate = new Date(expiresAt);
      if (isNaN(expDate.getTime())) {
        return res.status(400).json({ error: 'Invalid expiration date' });
      }
      if (expDate <= new Date()) {
        return res.status(400).json({ error: 'Expiration date must be in the future' });
      }
      shareData.expiresAt = expDate;
    }

    const share = await Share.create(shareData);

    // Generate the shareable URL (points to frontend client route)
    const baseUrl = getBaseUrl(req);
    const shareUrl = share.getShareUrl(baseUrl);

    res.status(201).json({ 
      share: {
        ...share.toJSON(),
        shareUrl,
        shareToken: share.shareToken // Include token for the creator
      }
    });
  } catch (error) {
    console.error('Error creating share:', error);
    res.status(500).json({ error: 'Failed to create share' });
  }
});

// Get all shares for a specific file
router.get('/file/:fileId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const fileId = parseInt(req.params.fileId);

    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    // Verify file exists and belongs to user
    const file = await File.findByIdAndUserId(fileId, userId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const shares = await Share.findAllByFileId(fileId, userId);
    const baseUrl = getBaseUrl(req);

    // Add share URLs to each share
    const sharesWithUrls = shares.map((share: any) => ({
      ...share.toJSON(),
      shareUrl: share.getShareUrl(baseUrl),
      shareToken: share.shareToken // Include token for the creator
    }));

    res.json({ shares: sharesWithUrls });
  } catch (error) {
    console.error('Error fetching file shares:', error);
    res.status(500).json({ error: 'Failed to fetch file shares' });
  }
});

// Get all shares for the authenticated user
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const shares = await Share.findAllByUserId(userId);
    const baseUrl = getBaseUrl(req);

    // Add share URLs to each share
    const sharesWithUrls = shares.map((share: any) => ({
      ...share.toJSON(),
      shareUrl: share.getShareUrl(baseUrl),
      shareToken: share.shareToken // Include token for the creator
    }));

    res.json({ shares: sharesWithUrls });
  } catch (error) {
    console.error('Error fetching user shares:', error);
    res.status(500).json({ error: 'Failed to fetch shares' });
  }
});

// Access a shared file (public endpoint)
router.get('/shared/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Share token required' });
    }

    // Find the share by token
    const share = await Share.findByToken(token);
    if (!share) {
      return res.status(404).json({ error: 'Share not found or expired' });
    }

    // Check if share can be accessed
    if (!share.canAccess()) {
      return res.status(410).json({ 
        error: 'Share is no longer available',
        reason: share.expiresAt && share.expiresAt < new Date() 
          ? 'expired' 
          : 'access_limit_reached'
      });
    }

    // Get the associated file
    const file = await File.findByIdAndUserId(share.fileId, share.userId);
    if (!file) {
      return res.status(404).json({ error: 'Associated file not found' });
    }

    // Record the access
    const accessGranted = await share.recordAccess();
    if (!accessGranted) {
      return res.status(410).json({ error: 'Share is no longer available' });
    }

    // Return file information and direct download/view URL
    res.json({
      file: {
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        url: file.url,
        uploadedAt: file.uploadedAt
      },
      share: {
        shareType: share.shareType,
        accessCount: share.accessCount,
        maxAccess: share.maxAccess,
        remainingAccess: share.maxAccess ? share.maxAccess - share.accessCount : null
      }
    });
  } catch (error) {
    console.error('Error accessing shared file:', error);
    res.status(500).json({ error: 'Failed to access shared file' });
  }
});

// Deactivate a share
router.patch('/:id/deactivate', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const shareId = parseInt(req.params.id);

    if (isNaN(shareId)) {
      return res.status(400).json({ error: 'Invalid share ID' });
    }

    // Find the share
    const shares = await Share.findAllByUserId(userId);
    const share = shares.find((s: any) => s.id === shareId);

    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    // Deactivate the share
    await share.deactivate();

    res.json({ 
      message: 'Share deactivated successfully',
      share: share.toJSON()
    });
  } catch (error) {
    console.error('Error deactivating share:', error);
    res.status(500).json({ error: 'Failed to deactivate share' });
  }
});

// Delete a share
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const shareId = parseInt(req.params.id);

    if (isNaN(shareId)) {
      return res.status(400).json({ error: 'Invalid share ID' });
    }

    // Find the share
    const shares = await Share.findAllByUserId(userId);
    const share = shares.find((s: any) => s.id === shareId);

    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    // Delete the share
    await share.destroy();

    res.json({ message: 'Share deleted successfully' });
  } catch (error) {
    console.error('Error deleting share:', error);
    res.status(500).json({ error: 'Failed to delete share' });
  }
});

export default router;
