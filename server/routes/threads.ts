// server/routes/threads.ts
import express from 'express';
import { ThreadsService } from '../services/ThreadsService.js';
import { requireAuth } from '../middleware/authMiddleWare.js';

const router = express.Router();

// Initiate Threads OAuth
router.get('/auth', (req, res) => {
  const threadsClientId = process.env.THREADS_CLIENT_ID;
  const redirectUri = 'https://streamscene.net/api/threads/callback';
  
  if (!threadsClientId) {
    return res.status(500).json({ error: 'Threads Client ID not configured' });
  }
  
  // Redirect to Threads OAuth
  const authUrl = `https://threads.net/oauth/authorize?client_id=${threadsClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=threads_basic,threads_content_publish&response_type=code`;
  res.redirect(authUrl);
});

// Initialize Threads service with config from env
const getThreadsService = (accessToken?: string, userId?: string) => {
  return new ThreadsService({
    appId: process.env.THREADS_CLIENT_ID!,
    appSecret: process.env.THREADS_CLIENT_SECRET!,
    accessToken,
    userId
  });
};

// GET /api/threads/status - Check if user has connected Threads
router.get('/status', requireAuth, async (req, res) => {
  try {
    const user = req.user as any;
    
    // Check if user has Threads tokens stored in your database
    // You'll need to add these fields to your User model
    const hasThreadsToken = user.threadsAccessToken && user.threadsUserId;
    
    res.json({
      connected: !!hasThreadsToken,
      userId: user.threadsUserId || null
    });
  } catch (error) {
    console.error('Error checking Threads status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// GET /api/threads/connect - Get OAuth URL for connecting
router.get('/connect', requireAuth, (req, res) => {
  try {
    const threadsService = getThreadsService();
    const redirectUri = `${process.env.BASE_URL}/api/threads/callback`;
    
    const authUrl = threadsService.getAuthorizationUrl(redirectUri, [
      'threads_basic',
      'threads_content_publish'
    ]);
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Error getting auth URL:', error);
    res.status(500).json({ error: 'Failed to get auth URL' });
  }
});

// GET /api/threads/callback - OAuth callback from Threads
router.get('/callback', requireAuth, async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code || typeof code !== 'string') {
      return res.redirect('/content-scheduler?error=no_code');
    }
    
    const threadsService = getThreadsService();
    const redirectUri = `${process.env.BASE_URL}/api/threads/callback`;
    
    // Exchange code for access token
    const tokenData = await threadsService.getAccessToken(code, redirectUri);
    
    // Save tokens to user in database
    const user = req.user as any;
    await user.update({
      threadsAccessToken: tokenData.access_token,
      threadsUserId: tokenData.user_id
    });
    
    // Redirect back to content scheduler
    res.redirect('/content-scheduler?connected=true');
  } catch (error) {
    console.error('Error in Threads callback:', error);
    res.redirect('/content-scheduler?error=auth_failed');
  }
});

// POST /api/threads/disconnect - Disconnect Threads account
router.post('/disconnect', requireAuth, async (req, res) => {
  try {
    const user = req.user as any;
    
    // Clear tokens from database
    await user.update({
      threadsAccessToken: null,
      threadsUserId: null
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Threads:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// POST /api/threads/post - Post to Threads
router.post('/post', requireAuth, async (req, res) => {
  try {
    const user = req.user as any;
    const { text, imageUrls } = req.body;
    
    if (!user.threadsAccessToken || !user.threadsUserId) {
      return res.status(401).json({ error: 'Threads not connected' });
    }
    
    const threadsService = getThreadsService(
      user.threadsAccessToken,
      user.threadsUserId
    );
    
    let result;
    if (imageUrls && imageUrls.length > 0) {
      result = await threadsService.postImage(imageUrls[0], text);
    } else {
      result = await threadsService.postText(text);
    }
    
    res.json({ success: true, postId: result.id, permalink: result.permalink });
  } catch (error: any) {
    console.error('Error posting to Threads:', error);
    res.status(500).json({ error: error.message || 'Failed to post' });
  }
});

export default router;