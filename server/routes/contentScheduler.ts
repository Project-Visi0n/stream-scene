// server/routes/contentScheduler.ts - With proper auth import

import express from 'express';
import { Request, Response } from 'express';
import { requireAuth } from '../middleware/authMiddleWare'; // Fixed import

const router = express.Router();

// Apply authentication middleware to all routes (uncomment when ready)
// router.use(requireAuth);

// Mock user for testing - remove when enabling real auth
const MOCK_USER_ID = 'user_123';

// Simple in-memory storage for testing
const mockPosts = [
  {
    id: 'post_1',
    userId: MOCK_USER_ID,
    content: 'Just launched our new X content scheduler! 🚀 Building the future of social media management. #XScheduler #ProductLaunch #TechInnovation',
    scheduledAt: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'published',
    xPostId: 'x_12345',
    analytics: {
      retweets: 23,
      likes: 156,
      replies: 12,
      views: 2341
    }
  },
  {
    id: 'post_2',
    userId: MOCK_USER_ID,
    content: 'Working on some exciting new features for content creators. The future is automated! ✨ What features would you like to see?',
    scheduledAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    status: 'scheduled',
    analytics: {
      retweets: 0,
      likes: 0,
      replies: 0,
      views: 0
    }
  }
];

const mockConnection = {
  isConnected: false,
  username: null,
  profileImage: null,
  lastConnected: null
};

// GET /api/content-scheduler/health - Health check
router.get('/health', async (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    message: 'Mock X API service is running',
    mode: 'mock',
    timestamp: new Date().toISOString()
  });
});

// GET /api/content-scheduler/connection - Get X connection status
router.get('/connection', async (req: Request, res: Response) => {
  try {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    res.json(mockConnection);
  } catch (error) {
    console.error('Error fetching X connection:', error);
    res.status(500).json({ error: 'Failed to fetch X connection status' });
  }
});

// GET /api/content-scheduler/posts - Get all X posts
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const { limit = 20, offset = 0, status } = req.query;
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 400));

    let filteredPosts = [...mockPosts];

    // Apply status filter
    if (status) {
      const statusArray = (status as string).split(',');
      filteredPosts = filteredPosts.filter(post => statusArray.includes(post.status));
    }

    // Apply pagination
    const paginatedPosts = filteredPosts.slice(Number(offset), Number(offset) + Number(limit));
    const hasMore = Number(offset) + Number(limit) < filteredPosts.length;

    res.json({
      posts: paginatedPosts,
      hasMore,
      total: filteredPosts.length
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// POST /api/content-scheduler/posts - Create new X post
router.post('/posts', async (req: Request, res: Response) => {
  try {
    const { content, scheduledAt, mediaIds } = req.body;
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Validate required fields
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post content is required' });
    }

    // Validate X character limit
    if (content.length > 280) {
      return res.status(400).json({ 
        error: `Content exceeds X character limit of 280 (current: ${content.length})` 
      });
    }

    const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;
    const isImmediate = !scheduledDate || scheduledDate <= new Date();

    const newPost = {
      id: postId,
      userId: MOCK_USER_ID,
      content: content.trim(),
      scheduledAt: scheduledDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: isImmediate ? 'published' : 'scheduled',
      media: mediaIds ? [] : undefined, // Handle media later
      xPostId: isImmediate ? `x_${Date.now()}` : undefined,
      analytics: isImmediate ? {
        retweets: 0,
        likes: 0,
        replies: 0,
        views: 0
      } : undefined
    };

    // Add to mock storage
    mockPosts.unshift(newPost);

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// DELETE /api/content-scheduler/posts/:id - Delete post
router.delete('/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const postIndex = mockPosts.findIndex(post => post.id === id);
    if (postIndex === -1) {
      return res.status(404).json({ error: 'Post not found' });
    }

    mockPosts.splice(postIndex, 1);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// POST /api/content-scheduler/connect - Start X OAuth flow
router.post('/connect', async (req: Request, res: Response) => {
  try {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock OAuth URL
    const authUrl = `/api/content-scheduler/mock-auth/x?user_id=${MOCK_USER_ID}&state=${Date.now()}`;
    res.json({ authUrl });
  } catch (error) {
    console.error('Error initiating X connection:', error);
    res.status(500).json({ error: 'Failed to initiate X connection' });
  }
});

// POST /api/content-scheduler/callback - Handle X OAuth callback
router.post('/callback', async (req: Request, res: Response) => {
  try {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Update mock connection
    mockConnection.isConnected = true;
    mockConnection.username = 'streamscene_dev';
    mockConnection.profileImage = 'https://api.dicebear.com/7.x/avataaars/svg?seed=streamscene';
    mockConnection.lastConnected = new Date().toISOString();

    res.json(mockConnection);
  } catch (error) {
    console.error('Error completing X OAuth:', error);
    res.status(500).json({ error: 'Failed to complete X connection' });
  }
});

// DELETE /api/content-scheduler/disconnect - Disconnect X account
router.delete('/disconnect', async (req: Request, res: Response) => {
  try {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Reset mock connection
    mockConnection.isConnected = false;
    mockConnection.username = null;
    mockConnection.profileImage = null;
    mockConnection.lastConnected = null;

    res.status(204).send();
  } catch (error) {
    console.error('Error disconnecting X account:', error);
    res.status(500).json({ error: 'Failed to disconnect X account' });
  }
});

// GET /api/content-scheduler/analytics - Get X analytics
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const publishedPosts = mockPosts.filter(p => p.status === 'published');
    const scheduledPosts = mockPosts.filter(p => p.status === 'scheduled');
    const failedPosts = mockPosts.filter(p => p.status === 'failed');

    const totalLikes = publishedPosts.reduce((sum, post) => sum + (post.analytics?.likes || 0), 0);
    const totalRetweets = publishedPosts.reduce((sum, post) => sum + (post.analytics?.retweets || 0), 0);
    const totalReplies = publishedPosts.reduce((sum, post) => sum + (post.analytics?.replies || 0), 0);
    const totalViews = publishedPosts.reduce((sum, post) => sum + (post.analytics?.views || 0), 0);

    // Generate recent activity data
    const recentActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      recentActivity.push({
        date: date.toISOString().split('T')[0],
        posts: Math.floor(Math.random() * 3) + 1,
        likes: Math.floor(Math.random() * 50) + 10,
        retweets: Math.floor(Math.random() * 20) + 2
      });
    }

    res.json({
      totalPosts: mockPosts.length,
      publishedPosts: publishedPosts.length,
      scheduledPosts: scheduledPosts.length,
      failedPosts: failedPosts.length,
      totalEngagement: totalLikes + totalRetweets + totalReplies,
      metrics: {
        totalLikes,
        totalRetweets,
        totalReplies,
        totalViews
      },
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Mock OAuth page for development
router.get('/mock-auth/x', (req: Request, res: Response) => {
  const { user_id, state } = req.query;
  
  const mockAuthPage = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Mock X Authorization</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
        .auth-box { border: 1px solid #ddd; border-radius: 8px; padding: 30px; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
        button { background: #000; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; }
        button:hover { background: #333; }
        .note { margin-top: 20px; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="auth-box">
        <div class="logo">𝕏</div>
        <h2>Authorize StreamScene</h2>
        <p>StreamScene would like permission to:</p>
        <ul style="text-align: left; margin: 20px 0;">
          <li>Read your account information</li>
          <li>Post tweets on your behalf</li>
          <li>Upload media</li>
        </ul>
        <button onclick="authorize()">Authorize App</button>
        <div class="note">
          <strong>Development Mode:</strong> This is a mock authorization page for testing.
        </div>
      </div>
      
      <script>
        function authorize() {
          // Call the callback endpoint
          fetch('/api/content-scheduler/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              oauth_token: 'mock_token_${state}',
              oauth_verifier: 'mock_verifier_${Date.now()}'
            })
          })
          .then(() => {
            alert('Mock Authorization Successful!');
            window.close();
          })
          .catch(console.error);
        }
      </script>
    </body>
    </html>
  `;
  
  res.send(mockAuthPage);
});

export default router;