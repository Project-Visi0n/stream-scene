import { Router } from 'express';
const router = Router();
router.get('/threads', (req, res) => {
    console.log('[Threads Auth] Starting OAuth flow');
    const scopes = [
        'threads_basic',
        'threads_content_publish',
        'threads_manage_insights',
        'threads_manage_replies'
    ].join(',');
    const state = Math.random().toString(36).substring(7);
    req.session.oauthState = state;
    const authUrl = new URL('https://threads.net/oauth/authorize');
    authUrl.searchParams.set('client_id', process.env.THREADS_CLIENT_ID || '');
    authUrl.searchParams.set('redirect_uri', `${process.env.BASE_URL}/auth/threads/callback`);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);
    console.log('[Threads Auth] Redirecting to:', authUrl.toString());
    res.redirect(authUrl.toString());
});
router.get('/threads/callback', async (req, res) => {
    try {
        console.log('[Threads Callback] Received:', req.query);
        const { code, state, error } = req.query;
        if (error) {
            console.error('[Threads Callback] OAuth error:', error);
            return res.redirect('/dashboard?error=threads_oauth_failed');
        }
        if (!code) {
            console.error('[Threads Callback] No authorization code received');
            return res.redirect('/dashboard?error=threads_no_code');
        }
        if (state !== req.session.oauthState) {
            console.error('[Threads Callback] State mismatch');
            return res.redirect('/dashboard?error=threads_state_mismatch');
        }
        // Exchange code for access token
        console.log('[Threads Callback] Exchanging code for token...');
        const tokenResponse = await fetch('https://graph.threads.net/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: process.env.THREADS_CLIENT_ID || '',
                client_secret: process.env.THREADS_CLIENT_SECRET || '',
                grant_type: 'authorization_code',
                redirect_uri: `${process.env.BASE_URL}/auth/threads/callback`,
                code: typeof code === 'string' ? code : ''
            })
        });
        const tokenData = await tokenResponse.json();
        console.log('[Threads Callback] Token response:', {
            success: tokenResponse.ok,
            hasAccessToken: !!tokenData.access_token,
            userId: tokenData.user_id
        });
        if (!tokenResponse.ok || !tokenData.access_token) {
            console.error('[Threads Callback] Token exchange failed:', tokenData);
            return res.redirect('/dashboard?error=threads_token_failed');
        }
        // Get user profile
        console.log('[Threads Callback] Fetching user profile...');
        const profileResponse = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url&access_token=${tokenData.access_token}`);
        const profileData = await profileResponse.json();
        console.log('[Threads Callback] Profile data:', {
            success: profileResponse.ok,
            username: profileData.username
        });
        if (!profileResponse.ok) {
            console.error('[Threads Callback] Profile fetch failed:', profileData);
            return res.redirect('/dashboard?error=threads_profile_failed');
        }
        // Store session data
        req.session.threadsAuth = {
            platform: 'threads',
            accessToken: tokenData.access_token,
            userId: profileData.id,
            username: profileData.username,
            connectedAt: new Date().toISOString()
        };
        console.log('[Threads Callback] Authentication successful for:', profileData.username);
        res.redirect('/dashboard?success=threads_connected');
    }
    catch (error) {
        console.error('[Threads Callback] Unexpected error:', error);
        res.redirect('/dashboard?error=threads_unexpected_error');
    }
});
// Disconnect Threads
router.post('/threads/disconnect', (req, res) => {
    try {
        if (req.session.threadsAuth) {
            delete req.session.threadsAuth;
            console.log('[Threads Disconnect] Success');
            res.json({ success: true });
        }
        else {
            res.status(400).json({ error: 'Threads not connected' });
        }
    }
    catch (error) {
        console.error('[Threads Disconnect] Error:', error);
        res.status(500).json({ error: 'Failed to disconnect Threads' });
    }
});
export default router;
//# sourceMappingURL=socialAuth.js.map