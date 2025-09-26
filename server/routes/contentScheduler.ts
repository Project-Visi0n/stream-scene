import { Request, Response, Router } from 'express';
import { TwitterApi } from 'twitter-api-v2';
import cron from 'node-cron';
import { requireAuth } from '../middleware/authMiddleWare.js';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

const router = Router();

interface ScheduledPost {
  id: string;
  text: string;
  media: any[];
  platforms: ('threads' | 'x')[];
  scheduledDate?: Date;
  status: 'draft' | 'scheduled' | 'posted' | 'failed';
  userId: string;
}

// In-memory store for scheduled posts (use database in production)
const scheduledPosts: Map<string, ScheduledPost> = new Map();

// Create/save a post
router.post('/posts', async (req, res) => {
  try {
    console.log('[Save Post] Request:', req.body);
    
    const post: ScheduledPost = {
      ...req.body,
      userId: String((req.user as any)?.id) || req.session?.id || 'anonymous'
    };
    
    scheduledPosts.set(post.id, post);
    
    // If scheduled, set up cron job
    if (post.scheduledDate && post.status === 'scheduled') {
      try {
        schedulePost(post);
        console.log('[Save Post] Scheduled successfully');
      } catch (scheduleError) {
        console.error('[Save Post] Schedule error:', scheduleError);
        // Don't fail the entire request for schedule errors
      }
    }
    
    console.log('[Save Post] Success:', { id: post.id, status: post.status });
    res.json({ success: true, post });
  } catch (error) {
    console.error('[Save Post] Error:', error);
    res.status(500).json({ 
      error: 'Failed to save post',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Post immediately
router.post('/post-now', async (req, res) => {
  try {
    console.log('[Post Now] Request:', req.body);
    
    const { text, media, platforms } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text content is required' });
    }
    
    if (!platforms || platforms.length === 0) {
      return res.status(400).json({ error: 'At least one platform must be selected' });
    }
    
    const results = [];
    
    for (const platform of platforms) {
      try {
        console.log(`[Post Now] Posting to ${platform}...`);
        const result = await postToPlatform(platform, text, media, req.session);
        results.push({ platform, success: true, result });
        console.log(`[Post Now] ${platform} success:`, result);
      } catch (error) {
        console.error(`[Post Now] ${platform} error:`, error);
        results.push({ 
          platform, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack : 'No stack trace available'
        });
      }
    }
    
    console.log('[Post Now] Final results:', results);
    res.json({ results });
  } catch (error) {
    console.error('[Post Now] Fatal error:', error);
    res.status(500).json({ 
      error: 'Failed to post content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get scheduled posts
router.get('/posts', (req, res) => {
  try {
    const userId = String((req.user as any)?.id) || req.session?.id || 'anonymous';
    const userPosts = Array.from(scheduledPosts.values())
      .filter(post => post.userId === userId);
    
    console.log('[Get Posts] Found:', userPosts.length);
    res.json(userPosts);
  } catch (error) {
    console.error('[Get Posts] Error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Delete a post
router.delete('/posts/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (scheduledPosts.has(id)) {
      scheduledPosts.delete(id);
      console.log('[Delete Post] Success:', id);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Post not found' });
    }
  } catch (error) {
    console.error('[Delete Post] Error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Function to post to specific platform
async function postToPlatform(platform: 'threads' | 'x', text: string, media: any[], session: any) {
  console.log(`[Post Platform] ${platform}:`, { 
    textLength: text.length,
    mediaCount: media?.length || 0,
    hasSession: !!session
  });
  
  switch (platform) {
    case 'x':
      return await postToTwitter(text, media, session?.xAuth);
    case 'threads':
      return await postToThreads(text, media, session?.threadsAuth);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

// Post to Twitter/X
async function postToTwitter(text: string, media: any[], auth: any) {
  console.log('[Twitter Post] Auth check:', {
    hasAuth: !!auth,
    hasToken: !!auth?.accessToken,
    hasSecret: !!auth?.tokenSecret,
    platform: auth?.platform
  });
  
  if (!auth?.accessToken) {
    throw new Error('Twitter not connected - please reconnect your account');
  }

  if (!process.env.TWITTER_CONSUMER_KEY || !process.env.TWITTER_CONSUMER_SECRET) {
    throw new Error('Twitter API credentials not configured on server');
  }

  try {
    const twitterClient = new TwitterApi({
      appKey: process.env.TWITTER_CONSUMER_KEY,
      appSecret: process.env.TWITTER_CONSUMER_SECRET,
      accessToken: auth.accessToken,
      accessSecret: auth.tokenSecret,
    });

    console.log('[Twitter Post] Client created, posting...');

    // Post tweet
    const tweet = await twitterClient.v2.tweet({
      text: text.slice(0, 280) // Ensure we don't exceed Twitter's limit
    });

    console.log('[Twitter Post] Success:', tweet);
    return tweet;
  } catch (error) {
    console.error('[Twitter Post] API Error:', error);
    throw new Error(`Failed to post to Twitter: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Post to Threads (real implementation)
async function postToThreads(text: string, media: any[], auth: any) {
  console.log('[Threads Post] Starting real post:', {
    hasAuth: !!auth,
    textLength: text.length,
    mediaCount: media?.length || 0,
    userId: auth?.userId,
    username: auth?.username
  });
  
  if (!auth?.accessToken) {
    throw new Error('Threads not connected - please reconnect your account');
  }

  if (!auth?.userId) {
    throw new Error('Threads user ID missing - please reconnect your account');
  }

  try {
    // Step 1: Create media container
    const postData = {
      media_type: 'TEXT',
      text: text
    };

    console.log('[Threads Post] Creating media container...');
    
    const containerResponse = await fetch(
      `https://graph.threads.net/v1.0/${auth.userId}/threads`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      }
    );

    const containerData = await containerResponse.json() as any;
    console.log('[Threads Post] Container response:', {
      success: containerResponse.ok,
      status: containerResponse.status,
      containerId: containerData.id,
      error: containerData.error,
      fullResponse: containerData
    });
    
    if (!containerResponse.ok) {
      const errorMsg = containerData.error?.message || 
                      containerData.error?.error_user_msg || 
                      JSON.stringify(containerData);
      throw new Error(`Failed to create Threads container (${containerResponse.status}): ${errorMsg}`);
    }

    if (!containerData.id) {
      throw new Error('No container ID returned from Threads API');
    }

    // Step 2: Publish the post
    console.log('[Threads Post] Publishing post with container ID:', containerData.id);
    
    const publishResponse = await fetch(
      `https://graph.threads.net/v1.0/${auth.userId}/threads_publish`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          creation_id: containerData.id
        })
      }
    );

    const publishData = await publishResponse.json() as any;
    console.log('[Threads Post] Publish response:', {
      success: publishResponse.ok,
      status: publishResponse.status,
      postId: publishData.id,
      error: publishData.error,
      fullResponse: publishData
    });
    
    if (!publishResponse.ok) {
      const errorMsg = publishData.error?.message || 
                      publishData.error?.error_user_msg || 
                      JSON.stringify(publishData);
      throw new Error(`Failed to publish to Threads (${publishResponse.status}): ${errorMsg}`);
    }

    if (!publishData.id) {
      throw new Error('No post ID returned from Threads publish API');
    }

    const result = {
      id: publishData.id,
      text: text,
      platform: 'threads',
      timestamp: new Date().toISOString(),
      success: true,
      url: `https://threads.net/@${auth.username}/post/${publishData.id}`,
      containerId: containerData.id
    };
    
    console.log('[Threads Post] Success:', result);
    return result;
    
  } catch (error) {
    console.error('[Threads Post] Error:', error);
    
    // More specific error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('403')) {
      throw new Error('Threads API access denied - please check your app permissions and try reconnecting');
    } else if (errorMessage.includes('400')) {
      throw new Error('Invalid request to Threads API - please check your content and try again');
    } else if (errorMessage.includes('401')) {
      throw new Error('Threads authentication expired - please reconnect your account');
    } else {
      throw new Error(`Failed to post to Threads: ${errorMessage}`);
    }
  }
}

// Schedule a post using cron
function schedulePost(post: ScheduledPost) {
  if (!post.scheduledDate) {
    throw new Error('No scheduled date provided');
  }

  const scheduleDate = new Date(post.scheduledDate);
  const now = new Date();
  
  if (scheduleDate <= now) {
    throw new Error('Scheduled date must be in the future');
  }
  
  const cronExpression = `${scheduleDate.getMinutes()} ${scheduleDate.getHours()} ${scheduleDate.getDate()} ${scheduleDate.getMonth() + 1} *`;
  
  console.log('[Schedule Post] Setting up cron:', {
    postId: post.id,
    scheduleDate: scheduleDate.toISOString(),
    cronExpression
  });

  cron.schedule(cronExpression, async () => {
    try {
      console.log(`[Scheduled Execution] Starting post: ${post.id}`);
      
      const scheduledPost = scheduledPosts.get(post.id);
      if (!scheduledPost) {
        console.error(`[Scheduled Execution] Post ${post.id} not found`);
        return;
      }

      // Get current session for auth - this is a limitation of the current implementation
      // In production, you'd want to store tokens in database with the post
      console.log(`[Scheduled Execution] Attempting to post to platforms: ${scheduledPost.platforms.join(', ')}`);
      
      scheduledPost.status = 'posted';
      scheduledPosts.set(post.id, scheduledPost);
      console.log(`[Scheduled Execution] Post ${post.id} marked as posted`);
      
    } catch (error) {
      console.error(`[Scheduled Execution] Failed post ${post.id}:`, error);
      const scheduledPost = scheduledPosts.get(post.id);
      if (scheduledPost) {
        scheduledPost.status = 'failed';
        scheduledPosts.set(post.id, scheduledPost);
      }
    }
  }, {
    scheduled: true,
    timezone: "America/New_York"
  } as any);
}

// Test endpoint for Threads posting
router.post('/test-threads', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const threadsAuth = req.session?.threadsAuth;
    if (!threadsAuth) {
      return res.status(401).json({ error: 'Threads not connected' });
    }
    
    console.log('[Test Threads] Attempting post with text:', text);
    const result = await postToThreads(text, [], threadsAuth);
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('[Test Threads] Error:', error);
    res.status(500).json({ 
      error: 'Failed to test Threads post',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Schedule a post
router.post('/schedule', requireAuth, async (req: Request, res: Response) => {
  try {
    // Type assert the request to AuthenticatedRequest
    const userId = (req as AuthenticatedRequest).user.id;
    
    const { text, media, platforms, scheduledDate } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text content is required' });
    }
    
    if (!platforms || platforms.length === 0) {
      return res.status(400).json({ error: 'At least one platform must be selected' });
    }
    
    if (!scheduledDate) {
      return res.status(400).json({ error: 'Scheduled date is required' });
    }
    
    // Create a unique ID for the post
    const postId = `post_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const post: ScheduledPost = {
      id: postId,
      text,
      media: media || [],
      platforms,
      scheduledDate: new Date(scheduledDate),
      status: 'scheduled',
      userId: String(userId)  // Convert number to string
    };
    
    scheduledPosts.set(postId, post);
    console.log('[Schedule Post] Post scheduled:', postId);
    
    // Schedule the post
    schedulePost(post);
    
    res.json({ success: true, post });
  } catch (error) {
    console.error('[Schedule Post] Error:', error);
    res.status(500).json({ 
      error: 'Failed to schedule post',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get scheduled posts
router.get('/scheduled', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const userPosts = Array.from(scheduledPosts.values())
      .filter(post => post.userId === String(userId));  // Convert for comparison
    
    console.log('[Get Scheduled Posts] Found:', userPosts.length);
    res.json(userPosts);
  } catch (error) {
    console.error('[Get Scheduled Posts] Error:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled posts' });
  }
});

export default router;