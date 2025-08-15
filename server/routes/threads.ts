import { Router } from 'express';
const router = Router();

// Get Threads connection status
router.get('/status', async (req, res) => {
  try {
    console.log('[Threads Status] Checking session for threads auth');
    
    // Check session for threads auth
    if (req.session?.threadsAuth) {
      console.log('[Threads Status] Found session auth for user:', req.session.threadsAuth.username);
      return res.json({
        connected: true,
        accountId: req.session.threadsAuth.userId,
        username: req.session.threadsAuth.username
      });
    }

    console.log('[Threads Status] No session auth found');
    res.json({ connected: false });
  } catch (error) {
    console.error('[Threads Status] Error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// Store/update Threads token (optional - for database storage)
router.post('/token', async (req, res) => {
  try {
    const { accountId, accessToken, expiresAt } = req.body;
    
    // For now, just store in session (type assertion for compatibility)
    req.session.threadsAuth = {
      ...req.session.threadsAuth,
      accessToken
    } as any;

    res.json({ success: true });
  } catch (error) {
    console.error('[Threads Token] Error:', error);
    res.status(500).json({ error: 'Failed to store token' });
  }
});

// Schedule a Threads post
router.post('/schedule', async (req, res) => {
  try {
    const { accountId, text, media, scheduledFor } = req.body;
    
    console.log('[Threads Schedule] Request:', { accountId, text: text?.slice(0, 50), scheduledFor });

    // Get access token from session
    const accessToken = req.session?.threadsAuth?.accessToken;
    if (!accessToken) {
      return res.status(400).json({ error: 'Threads not connected - no access token found' });
    }

    // Verify account ID matches session
    if (req.session.threadsAuth?.userId !== accountId) {
      return res.status(400).json({ error: 'Account ID mismatch' });
    }

    // Create media container if media is provided
    let mediaContainerId;
    if (media?.imageUrls?.length || media?.videoUrl) {
      console.log('[Threads Schedule] Creating media container...');
      
      const mediaPayload: any = {
        media_type: media.videoUrl ? 'VIDEO' : 'IMAGE',
        access_token: accessToken
      };

      if (media.videoUrl) {
        mediaPayload.video_url = media.videoUrl;
      } else if (media.imageUrls?.[0]) {
        mediaPayload.image_url = media.imageUrls[0];
      }

      const mediaResponse = await fetch(`https://graph.threads.net/v1.0/${accountId}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mediaPayload)
      });

      const mediaData = await mediaResponse.json() as any;
      console.log('[Threads Schedule] Media response:', { ok: mediaResponse.ok, data: mediaData });
      
      if (!mediaResponse.ok) {
        console.error('[Threads Schedule] Media creation failed:', mediaData);
        return res.status(400).json({ 
          error: 'Failed to create media container', 
          details: mediaData 
        });
      }
      mediaContainerId = mediaData.id;
    }

    // Create text post container
    console.log('[Threads Schedule] Creating post container...');
    
    const postPayload: any = {
      media_type: 'TEXT',
      text: text,
      access_token: accessToken
    };

    if (mediaContainerId) {
      postPayload.children = [mediaContainerId];
      postPayload.media_type = 'CAROUSEL';
    }

    const postResponse = await fetch(`https://graph.threads.net/v1.0/${accountId}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postPayload)
    });

    const postData = await postResponse.json() as any;
    console.log('[Threads Schedule] Post response:', { ok: postResponse.ok, data: postData });
    
    if (!postResponse.ok) {
      console.error('[Threads Schedule] Post creation failed:', postData);
      return res.status(400).json({ 
        error: 'Failed to create post container',
        details: postData 
      });
    }

    console.log('[Threads Schedule] Successfully created post container:', postData.id);
    
    res.json({
      ok: true,
      post: {
        id: postData.id,
        text: text,
        scheduledFor: scheduledFor,
        status: 'scheduled'
      }
    });

  } catch (error) {
    console.error('[Threads Schedule] Error:', error);
    res.status(500).json({ error: 'Failed to schedule post', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Publish a scheduled post immediately
router.post('/publish-now/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('[Threads Publish] Publishing post:', id);

    // Get access token from session
    const accessToken = req.session?.threadsAuth?.accessToken;
    if (!accessToken) {
      return res.status(400).json({ error: 'Threads not connected - no access token found' });
    }

    // Publish the post
    const publishResponse = await fetch(`https://graph.threads.net/v1.0/${id}/threads_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken })
    });

    const publishData = await publishResponse.json() as any;
    console.log('[Threads Publish] Publish response:', { ok: publishResponse.ok, data: publishData });
    
    if (!publishResponse.ok) {
      console.error('[Threads Publish] Failed:', publishData);
      return res.status(400).json({ 
        error: 'Failed to publish post',
        details: publishData 
      });
    }

    console.log('[Threads Publish] Successfully published:', publishData.id);

    res.json({
      ok: true,
      published: true,
      threadId: publishData.id
    });

  } catch (error) {
    console.error('[Threads Publish] Error:', error);
    res.status(500).json({ error: 'Failed to publish post', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Test endpoint for debugging
router.post('/test', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!req.session?.threadsAuth) {
      return res.status(400).json({ error: 'Threads not connected' });
    }

    res.json({ 
      success: true, 
      message: 'Test successful',
      sessionAuth: {
        connected: true,
        userId: req.session.threadsAuth.userId,
        username: req.session.threadsAuth.username
      }
    });
  } catch (error) {
    console.error('[Threads Test] Error:', error);
    res.status(500).json({ error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;