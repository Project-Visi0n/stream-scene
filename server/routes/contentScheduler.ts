// server/routes/contentScheduler.ts

import express from 'express';
import { Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleWare';

const router = express.Router();

// Interfaces matching frontend types
interface CreatePostRequest {
  platforms: string[];
  content: {
    text: string;
    mediaAssets: Array<{
      id: string;
      type: 'image' | 'video' | 'gif';
      url: string;
      filename: string;
    }>;
    hashtags: string[];
    mentions: string[];
  };
  scheduledTime: string;
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval?: number;
    endDate?: string;
    daysOfWeek?: number[];
  };
  projectId?: string;
}

interface ScheduledPost {
  id: string;
  userId: string;
  platforms: string[];
  content: {
    text: string;
    mediaAssets: Array<{
      id: string;
      type: string;
      url: string;
      filename: string;
    }>;
    hashtags: string[];
    mentions: string[];
  };
  scheduledTime: Date;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  recurrence?: any;
  projectId?: string;
  analytics?: {
    impressions?: number;
    engagement?: number;
    clicks?: number;
  };
  errorMessage?: string;
}

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET /api/content-scheduler/posts - Get all posts with optional filtering
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const { platforms, status, startDate, endDate, projectId } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Build filter conditions
    const filters: any = { userId };
    
    if (platforms) {
      const platformArray = (platforms as string).split(',');
      filters.platforms = { $in: platformArray };
    }
    
    if (status) {
      const statusArray = (status as string).split(',');
      filters.status = { $in: statusArray };
    }
    
    if (startDate && endDate) {
      filters.scheduledTime = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    
    if (projectId) {
      filters.projectId = projectId;
    }

    // Mock data for now - replace with actual database query
    const mockPosts: ScheduledPost[] = [
      {
        id: '1',
        userId: userId,
        platforms: ['twitter', 'linkedin'],
        content: {
          text: 'Just finished an amazing project! Check out our latest work on creative production workflows. #StreamScene #CreativeTools #ProductionLife',
          mediaAssets: [{ id: '1', type: 'image', url: '/uploads/project-preview.jpg', filename: 'project-preview.jpg' }],
          hashtags: ['StreamScene', 'CreativeTools', 'ProductionLife'],
          mentions: []
        },
        scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'scheduled',
        analytics: { impressions: 0, engagement: 0, clicks: 0 }
      },
      {
        id: '2',
        userId: userId,
        platforms: ['instagram'],
        content: {
          text: 'Behind the scenes of our latest video production. The magic happens in the details! ✨',
          mediaAssets: [{ id: '2', type: 'video', url: '/uploads/bts-video.mp4', filename: 'bts-video.mp4' }],
          hashtags: ['BehindTheScenes', 'VideoProduction', 'CreativeProcess'],
          mentions: []
        },
        scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'scheduled'
      }
    ];

    // Apply filters to mock data
    let filteredPosts = mockPosts.filter(post => post.userId === userId);
    
    if (platforms) {
      const platformArray = (platforms as string).split(',');
      filteredPosts = filteredPosts.filter(post => 
        post.platforms.some(p => platformArray.includes(p))
      );
    }
    
    if (status) {
      const statusArray = (status as string).split(',');
      filteredPosts = filteredPosts.filter(post => statusArray.includes(post.status));
    }

    res.json(filteredPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/content-scheduler/posts/:id - Get specific post
router.get('/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock response - replace with database query
    const mockPost: ScheduledPost = {
      id: id,
      userId: userId,
      platforms: ['twitter', 'linkedin'],
      content: {
        text: 'Sample post content',
        mediaAssets: [],
        hashtags: ['sample'],
        mentions: []
      },
      scheduledTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'scheduled'
    };

    res.json(mockPost);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /api/content-scheduler/posts - Create new post
router.post('/posts', async (req: Request, res: Response) => {
  try {
    const postData: CreatePostRequest = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate required fields
    if (!postData.platforms || postData.platforms.length === 0) {
      return res.status(400).json({ error: 'At least one platform is required' });
    }

    if (!postData.content || !postData.content.text.trim()) {
      return res.status(400).json({ error: 'Post content is required' });
    }

    // Validate platform-specific character limits
    const platformLimits: Record<string, number> = {
      twitter: 280,
      instagram: 2200,
      linkedin: 3000,
      facebook: 63206,
      youtube: 5000,
      tiktok: 150
    };

    for (const platform of postData.platforms) {
      const limit = platformLimits[platform];
      if (limit && postData.content.text.length > limit) {
        return res.status(400).json({ 
          error: `Content exceeds ${platform} character limit of ${limit}` 
        });
      }
    }

    // Create post object
    const newPost: ScheduledPost = {
      id: Date.now().toString(), // Use proper ID generation in production
      userId: userId,
      platforms: postData.platforms,
      content: {
        text: postData.content.text,
        mediaAssets: postData.content.mediaAssets || [],
        hashtags: postData.content.hashtags || [],
        mentions: postData.content.mentions || []
      },
      scheduledTime: new Date(postData.scheduledTime),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: new Date(postData.scheduledTime) <= new Date() ? 'published' : 'scheduled',
      recurrence: postData.recurrence,
      projectId: postData.projectId
    };

    // In production, save to database here
    // await PostModel.create(newPost);

    // Schedule the post if it's for the future
    if (newPost.status === 'scheduled') {
      // Add to job queue for scheduling
      console.log(`Post ${newPost.id} scheduled for ${newPost.scheduledTime}`);
    }

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// PUT /api/content-scheduler/posts/:id - Update existing post
router.put('/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // In production, update in database
    // const updatedPost = await PostModel.findOneAndUpdate(
    //   { id, userId },
    //   { ...updateData, updatedAt: new Date() },
    //   { new: true }
    // );

    // Mock response
    const updatedPost: ScheduledPost = {
      id: id,
      userId: userId,
      platforms: updateData.platforms || ['twitter'],
      content: updateData.content || { text: '', mediaAssets: [], hashtags: [], mentions: [] },
      scheduledTime: new Date(updateData.scheduledTime || new Date()),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'scheduled'
    };

    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// DELETE /api/content-scheduler/posts/:id - Delete post
router.delete('/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // In production, delete from database
    // await PostModel.deleteOne({ id, userId });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// POST /api/content-scheduler/posts/bulk - Bulk operations
router.post('/posts/bulk', async (req: Request, res: Response) => {
  try {
    const { posts } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const createdPosts: ScheduledPost[] = [];

    for (const postData of posts) {
      const newPost: ScheduledPost = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId: userId,
        platforms: postData.platforms,
        content: postData.content,
        scheduledTime: new Date(postData.scheduledTime),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'scheduled',
        projectId: postData.projectId
      };

      createdPosts.push(newPost);
    }

    res.status(201).json(createdPosts);
  } catch (error) {
    console.error('Error bulk creating posts:', error);
    res.status(500).json({ error: 'Failed to bulk create posts' });
  }
});

// DELETE /api/content-scheduler/posts/bulk - Bulk delete
router.delete('/posts/bulk', async (req: Request, res: Response) => {
  try {
    const { postIds } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // In production, delete from database
    // await PostModel.deleteMany({ id: { $in: postIds }, userId });

    res.status(204).send();
  } catch (error) {
    console.error('Error bulk deleting posts:', error);
    res.status(500).json({ error: 'Failed to bulk delete posts' });
  }
});

// POST /api/content-scheduler/posts/:id/duplicate - Duplicate post
router.post('/posts/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newScheduledTime } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock duplication
    const duplicatedPost: ScheduledPost = {
      id: Date.now().toString(),
      userId: userId,
      platforms: ['twitter'],
      content: {
        text: 'Duplicated post content',
        mediaAssets: [],
        hashtags: [],
        mentions: []
      },
      scheduledTime: newScheduledTime ? new Date(newScheduledTime) : new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'scheduled'
    };

    res.status(201).json(duplicatedPost);
  } catch (error) {
    console.error('Error duplicating post:', error);
    res.status(500).json({ error: 'Failed to duplicate post' });
  }
});

// POST /api/content-scheduler/posts/:id/publish - Publish post immediately
router.post('/posts/:id/publish', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock immediate publishing
    const publishedPost: ScheduledPost = {
      id: id,
      userId: userId,
      platforms: ['twitter'],
      content: {
        text: 'Published post content',
        mediaAssets: [],
        hashtags: [],
        mentions: []
      },
      scheduledTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'published',
      analytics: { impressions: 0, engagement: 0, clicks: 0 }
    };

    res.json(publishedPost);
  } catch (error) {
    console.error('Error publishing post:', error);
    res.status(500).json({ error: 'Failed to publish post' });
  }
});

// GET /api/content-scheduler/templates - Get content templates
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock templates - replace with database query
    const mockTemplates = [
      {
        id: '1',
        name: 'Product Launch',
        content: {
          text: 'Exciting news! We\'re launching {product_name} 🚀\n\nKey features:\n• {feature_1}\n• {feature_2}\n• {feature_3}\n\nGet ready for something amazing! #ProductLaunch #Innovation',
          mediaAssets: [],
          hashtags: ['ProductLaunch', 'Innovation', 'NewProduct'],
          mentions: []
        },
        platforms: ['twitter', 'linkedin', 'facebook'],
        userId: userId,
        createdAt: new Date()
      },
      {
        id: '2',
        name: 'Behind the Scenes',
        content: {
          text: 'Taking you behind the scenes of {project_name} ✨\n\nThe magic happens when creative minds come together. Here\'s a glimpse into our process...\n\n#BehindTheScenes #CreativeProcess',
          mediaAssets: [],
          hashtags: ['BehindTheScenes', 'CreativeProcess', 'TeamWork'],
          mentions: []
        },
        platforms: ['instagram', 'facebook'],
        userId: userId,
        createdAt: new Date()
      }
    ];

    res.json(mockTemplates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// POST /api/content-scheduler/templates - Create new template
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const templateData = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const newTemplate = {
      id: Date.now().toString(),
      name: templateData.name,
      content: templateData.content,
      platforms: templateData.platforms,
      userId: userId,
      createdAt: new Date()
    };

    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// DELETE /api/content-scheduler/templates/:id - Delete template
router.delete('/templates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // In production, delete from database
    // await TemplateModel.deleteOne({ id, userId });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// GET /api/content-scheduler/calendar - Get calendar events
router.get('/calendar', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Mock calendar events
    const mockEvents = [
      {
        id: '1',
        title: 'Product launch post',
        start: new Date(Date.now() + 2 * 60 * 60 * 1000),
        end: new Date(Date.now() + 2 * 60 * 60 * 1000),
        platforms: ['twitter', 'linkedin'],
        status: 'scheduled',
        content: 'Exciting product launch announcement...'
      },
      {
        id: '2',
        title: 'Behind the scenes video',
        start: new Date(Date.now() + 24 * 60 * 60 * 1000),
        end: new Date(Date.now() + 24 * 60 * 60 * 1000),
        platforms: ['instagram'],
        status: 'scheduled',
        content: 'Take a look behind the scenes...'
      }
    ];

    res.json(mockEvents);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// GET /api/content-scheduler/platforms - Get platform credentials
router.get('/platforms', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock platform credentials
    const mockCredentials = [
      {
        platform: 'twitter',
        connected: true,
        username: '@streamscene',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        permissions: ['read', 'write']
      },
      {
        platform: 'instagram',
        connected: false,
        username: null,
        expiresAt: null,
        permissions: []
      },
      {
        platform: 'linkedin',
        connected: true,
        username: 'StreamScene Company',
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        permissions: ['read', 'write']
      },
      {
        platform: 'facebook',
        connected: false,
        username: null,
        expiresAt: null,
        permissions: []
      }
    ];

    res.json(mockCredentials);
  } catch (error) {
    console.error('Error fetching platform credentials:', error);
    res.status(500).json({ error: 'Failed to fetch platform credentials' });
  }
});

// POST /api/content-scheduler/platforms/connect - Connect platform
router.post('/platforms/connect', async (req: Request, res: Response) => {
  try {
    const { platform, authCode } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!platform || !authCode) {
      return res.status(400).json({ error: 'Platform and auth code are required' });
    }

    // Mock platform connection
    const connectedPlatform = {
      platform: platform,
      connected: true,
      username: `@user_${platform}`,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      permissions: ['read', 'write']
    };

    res.status(201).json(connectedPlatform);
  } catch (error) {
    console.error('Error connecting platform:', error);
    res.status(500).json({ error: 'Failed to connect platform' });
  }
});

// DELETE /api/content-scheduler/platforms/:platform - Disconnect platform
router.delete('/platforms/:platform', async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // In production, remove platform credentials from database
    console.log(`Disconnecting ${platform} for user ${userId}`);

    res.status(204).send();
  } catch (error) {
    console.error('Error disconnecting platform:', error);
    res.status(500).json({ error: 'Failed to disconnect platform' });
  }
});

// GET /api/content-scheduler/analytics - Get analytics data
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock analytics data
    const mockAnalytics = {
      totalPosts: 45,
      publishedPosts: 38,
      failedPosts: 2,
      totalEngagement: 12450,
      platformBreakdown: {
        twitter: { posts: 15, engagement: 3200 },
        instagram: { posts: 12, engagement: 4800 },
        linkedin: { posts: 8, engagement: 2100 },
        facebook: { posts: 10, engagement: 2350 },
        youtube: { posts: 3, engagement: 1200 },
        tiktok: { posts: 5, engagement: 1800 }
      },
      recentActivity: [
        { date: '2024-08-01', posts: 5, engagement: 1200 },
        { date: '2024-08-02', posts: 3, engagement: 890 },
        { date: '2024-08-03', posts: 7, engagement: 1580 },
        { date: '2024-08-04', posts: 4, engagement: 950 },
        { date: '2024-08-05', posts: 6, engagement: 1340 },
        { date: '2024-08-06', posts: 8, engagement: 1680 },
        { date: '2024-08-07', posts: 5, engagement: 1150 }
      ]
    };

    res.json(mockAnalytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// POST /api/content-scheduler/media - Upload media
router.post('/media', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock media upload - in production, handle file upload here
    const mockUploadResult = {
      id: Date.now().toString(),
      url: `/uploads/media_${Date.now()}.jpg`,
      type: 'image',
      filename: 'uploaded_image.jpg',
      size: 1024000
    };

    res.status(201).json(mockUploadResult);
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
});

// GET /api/content-scheduler/media - Get media library
router.get('/media', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { type, search, limit = 20, offset = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock media library
    const mockMedia = [
      { id: '1', type: 'image', url: '/uploads/project-1.jpg', filename: 'project-1.jpg', size: 1024000, createdAt: new Date() },
      { id: '2', type: 'image', url: '/uploads/behind-scenes.jpg', filename: 'behind-scenes.jpg', size: 856000, createdAt: new Date() },
      { id: '3', type: 'video', url: '/uploads/demo-video.mp4', filename: 'demo-video.mp4', size: 5242880, createdAt: new Date() },
      { id: '4', type: 'image', url: '/uploads/product-shot.jpg', filename: 'product-shot.jpg', size: 1536000, createdAt: new Date() },
      { id: '5', type: 'gif', url: '/uploads/animation.gif', filename: 'animation.gif', size: 2048000, createdAt: new Date() }
    ];

    let filteredMedia = mockMedia;

    if (type && type !== 'all') {
      filteredMedia = filteredMedia.filter(media => media.type === type);
    }

    if (search) {
      filteredMedia = filteredMedia.filter(media => 
        media.filename.toLowerCase().includes((search as string).toLowerCase())
      );
    }

    const paginatedMedia = filteredMedia.slice(
      Number(offset), 
      Number(offset) + Number(limit)
    );

    res.json({
      media: paginatedMedia,
      total: filteredMedia.length,
      hasMore: Number(offset) + Number(limit) < filteredMedia.length
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// DELETE /api/content-scheduler/media/:id - Delete media
router.delete('/media/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // In production, delete media file and database record
    console.log(`Deleting media ${id} for user ${userId}`);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

// POST /api/content-scheduler/webhooks/platform - Handle platform webhooks
router.post('/webhooks/:platform', async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const webhookData = req.body;

    // Handle platform-specific webhook events
    console.log(`Received webhook from ${platform}:`, webhookData);

    // Update post status, analytics, etc. based on webhook data
    switch (platform) {
      case 'twitter':
        // Handle Twitter webhook events
        break;
      case 'instagram':
        // Handle Instagram webhook events
        break;
      case 'linkedin':
        // Handle LinkedIn webhook events
        break;
      default:
        console.log(`Unknown platform webhook: ${platform}`);
    }

    res.status(200).json({ status: 'processed' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

export default router;