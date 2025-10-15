import { Router } from 'express';
const router = Router();
// Initiate Threads OAuth
router.get('/auth', (req, res) => {
    const threadsClientId = process.env.THREADS_CLIENT_ID;
    const redirectUri = 'https://streamscene.net/api/threads/callback';
    if (!threadsClientId) {
        return res.status(500).json({ error: 'Threads Client ID not configured' });
    }
    const scopes = 'threads_basic,threads_content_publish';
    const state = Math.random().toString(36).substring(2); // CSRF protection
    // Store state in session for verification
    req.session.threadsState = state;
    const authUrl = `https://threads.net/oauth/authorize?` +
        `client_id=${threadsClientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${scopes}&` +
        `response_type=code&` +
        `state=${state}`;
    console.log('[Threads Auth] Redirecting to:', authUrl);
    res.redirect(authUrl);
});
// Handle OAuth callback
router.get('/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        console.log('[Threads Callback] Received:', { code: !!code, state });
        // Verify state parameter (CSRF protection)
        if (state !== req.session.threadsState) {
            return res.status(400).json({ error: 'Invalid state parameter' });
        }
        if (!code) {
            return res.status(400).json({ error: 'Authorization code not provided' });
        }
        // Exchange code for access token
        const tokenResponse = await fetch('https://graph.threads.net/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.THREADS_CLIENT_ID,
                client_secret: process.env.THREADS_CLIENT_SECRET,
                grant_type: 'authorization_code',
                redirect_uri: 'https://streamscene.net/api/threads/callback',
                code: code
            })
        });
        const tokenData = await tokenResponse.json();
        console.log('[Threads Callback] Token response:', { ok: tokenResponse.ok, hasToken: !!tokenData.access_token });
        if (!tokenResponse.ok || !tokenData.access_token) {
            console.error('[Threads Callback] Token exchange failed:', tokenData);
            return res.status(400).json({ error: 'Failed to exchange code for token', details: tokenData });
        }
        // Get user info
        const userResponse = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username&access_token=${tokenData.access_token}`);
        const userData = await userResponse.json();
        console.log('[Threads Callback] User data:', { ok: userResponse.ok, username: userData.username });
        if (!userResponse.ok) {
            console.error('[Threads Callback] User info failed:', userData);
            return res.status(400).json({ error: 'Failed to get user info', details: userData });
        }
        // Store in session
        req.session.threadsAuth = {
            userId: userData.id,
            username: userData.username,
            accessToken: tokenData.access_token
        };
        // Clean up state
        delete req.session.threadsState;
        console.log('[Threads Callback] Successfully authenticated user:', userData.username);
        // Redirect to frontend success page
        res.redirect('/?threads=connected');
    }
    catch (error) {
        console.error('[Threads Callback] Error:', error);
        res.status(500).json({ error: 'OAuth callback failed', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});
// Get Threads connection status
router.get('/status', async (req, res) => {
    var _a;
    try {
        console.log('[Threads Status] Checking session for threads auth');
        // Check session for threads auth
        if ((_a = req.session) === null || _a === void 0 ? void 0 : _a.threadsAuth) {
            console.log('[Threads Status] Found session auth for user:', req.session.threadsAuth.username);
            return res.json({
                connected: true,
                accountId: req.session.threadsAuth.userId,
                username: req.session.threadsAuth.username
            });
        }
        console.log('[Threads Status] No session auth found');
        res.json({ connected: false });
    }
    catch (error) {
        console.error('[Threads Status] Error:', error);
        res.status(500).json({ error: 'Failed to check status' });
    }
});
// Store/update Threads token (optional - for database storage)
router.post('/token', async (req, res) => {
    try {
        const { accountId, accessToken, expiresAt } = req.body;
        // For now, just store in session (type assertion for compatibility)
        req.session.threadsAuth = Object.assign(Object.assign({}, req.session.threadsAuth), { accessToken });
        res.json({ success: true });
    }
    catch (error) {
        console.error('[Threads Token] Error:', error);
        res.status(500).json({ error: 'Failed to store token' });
    }
});
// Schedule a Threads post
router.post('/schedule', async (req, res) => {
    var _a, _b, _c, _d, _e;
    try {
        const { accountId, text, media, scheduledFor } = req.body;
        console.log('[Threads Schedule] Request:', { accountId, text: text === null || text === void 0 ? void 0 : text.slice(0, 50), scheduledFor });
        // Get access token from session
        const accessToken = (_b = (_a = req.session) === null || _a === void 0 ? void 0 : _a.threadsAuth) === null || _b === void 0 ? void 0 : _b.accessToken;
        if (!accessToken) {
            return res.status(400).json({ error: 'Threads not connected - no access token found' });
        }
        // Verify account ID matches session
        if (((_c = req.session.threadsAuth) === null || _c === void 0 ? void 0 : _c.userId) !== accountId) {
            return res.status(400).json({ error: 'Account ID mismatch' });
        }
        // Create media container if media is provided
        let mediaContainerId;
        if (((_d = media === null || media === void 0 ? void 0 : media.imageUrls) === null || _d === void 0 ? void 0 : _d.length) || (media === null || media === void 0 ? void 0 : media.videoUrl)) {
            console.log('[Threads Schedule] Creating media container...');
            const mediaPayload = {
                media_type: media.videoUrl ? 'VIDEO' : 'IMAGE',
                access_token: accessToken
            };
            if (media.videoUrl) {
                mediaPayload.video_url = media.videoUrl;
            }
            else if ((_e = media.imageUrls) === null || _e === void 0 ? void 0 : _e[0]) {
                mediaPayload.image_url = media.imageUrls[0];
            }
            const mediaResponse = await fetch(`https://graph.threads.net/v1.0/${accountId}/threads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mediaPayload)
            });
            const mediaData = await mediaResponse.json();
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
        const postPayload = {
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
        const postData = await postResponse.json();
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
    }
    catch (error) {
        console.error('[Threads Schedule] Error:', error);
        res.status(500).json({ error: 'Failed to schedule post', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});
// Publish a scheduled post immediately
router.post('/publish-now/:id', async (req, res) => {
    var _a, _b, _c, _d;
    try {
        const { id } = req.params;
        console.log('[Threads Publish] Publishing post:', id);
        // Get access token from session
        const accessToken = (_b = (_a = req.session) === null || _a === void 0 ? void 0 : _a.threadsAuth) === null || _b === void 0 ? void 0 : _b.accessToken;
        const accountId = (_d = (_c = req.session) === null || _c === void 0 ? void 0 : _c.threadsAuth) === null || _d === void 0 ? void 0 : _d.userId;
        if (!accessToken || !accountId) {
            return res.status(400).json({ error: 'Threads not connected - no access token found' });
        }
        // Publish the post
        const publishResponse = await fetch(`https://graph.threads.net/v1.0/${accountId}/threads_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                creation_id: id,
                access_token: accessToken
            })
        });
        const publishData = await publishResponse.json();
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
    }
    catch (error) {
        console.error('[Threads Publish] Error:', error);
        res.status(500).json({ error: 'Failed to publish post', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});
// Disconnect Threads
router.post('/disconnect', (req, res) => {
    try {
        delete req.session.threadsAuth;
        res.json({ success: true, disconnected: true });
    }
    catch (error) {
        console.error('[Threads Disconnect] Error:', error);
        res.status(500).json({ error: 'Failed to disconnect' });
    }
});
export default router;
