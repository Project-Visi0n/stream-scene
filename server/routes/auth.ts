import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import crypto from 'crypto';

const router = express.Router();

const THREADS_CLIENT_ID = process.env.THREADS_CLIENT_ID;
const THREADS_CLIENT_SECRET = process.env.THREADS_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || 'https://streamscene.net';
const THREADS_REDIRECT_URI = `${BASE_URL}/auth/threads/callback`;

router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Auth routes are working!' });
});

router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[AUTH] ${req.method} ${req.path}`, {
    query: req.query,
    headers: req.get('host'),
    session: req.sessionID
  });
  next();
});

router.get(
  '/google',
  (req: Request, res: Response, next: NextFunction) => {
    console.log('=== Google OAuth Debug ===');
    console.log('Host:', req.get('host'));
    console.log('Protocol:', req.protocol);
    console.log('Original URL:', req.originalUrl);
    console.log('Full URL:', `${req.protocol}://${req.get('host')}${req.originalUrl}`);
    console.log('OAuth initiation started...');
    next();
  },
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
    console.log('=== Google Callback Started ===');
    console.log('Query params:', req.query);
    
    if (req.query.error) {
      console.error('Google returned error:', req.query.error);
      return res.redirect(`/?error=${req.query.error}`);
    }
    
    if (!req.query.code) {
      console.error('No authorization code in callback');
      return res.redirect('/?error=no_code');
    }
    
    console.log('Authorization code received, proceeding to authenticate...');
    next();
  },
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', (err: any, user: any, info: any) => {
      console.log('=== Passport Authenticate Result ===');
      console.log('Error:', err);
      console.log('User:', user ? 'User object present' : 'No user');
      console.log('Info:', info);
      
      if (err) {
        console.error('Authentication error:', err);
        return res.redirect('/?error=auth_failed');
      }
      
      if (!user) {
        console.error('No user returned from authentication');
        return res.redirect('/?error=no_user');
      }
      
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('Login error:', loginErr);
          return res.redirect('/?error=login_failed');
        }
        
        console.log('Login successful, saving session...');
        
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.redirect('/?error=session_failed');
          }
          
          console.log('Session saved, redirecting to client...');
          const redirectUrl = process.env.CLIENT_URL || `https://${req.get('host')}`;
          console.log('Redirecting to:', redirectUrl);
          res.redirect(redirectUrl);
        });
      });
    })(req, res, next);
  }
);

router.get('/threads', (req: Request, res: Response) => {
  console.log('=== Threads OAuth Debug ===');
  console.log('Current user:', req.user ? 'Logged in' : 'Not logged in');
  console.log('Initiating Threads connection...');
  
  if (!THREADS_CLIENT_ID) {
    console.error('THREADS_CLIENT_ID not configured');
    return res.redirect('/?error=threads_not_configured');
  }
  
  // Generate a random state parameter for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');
  
  // Store the state in the session to verify later
  req.session.threadsOAuthState = state;
  
  const scopes = [
    'threads_basic',
    'threads_content_publish',
    'threads_manage_insights',
    'threads_manage_replies',
    'threads_read_replies'
  ].join(',');

  // FIXED: Changed from threads.net to threads.com
  const authUrl = `https://www.threads.com/oauth/authorize?` +
    `client_id=${THREADS_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(THREADS_REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&response_type=code` +
    `&state=${state}`;

  console.log('Redirecting to Threads OAuth with state:', state);
  console.log('Auth URL:', authUrl);
  res.redirect(authUrl);
});

router.get('/threads/callback', async (req: Request, res: Response) => {
  console.log('=== Threads Callback Started ===');
  console.log('Query params:', req.query);
  console.log('Current user:', req.user ? 'Logged in' : 'Not logged in');
  
  const { code, error, state } = req.query;

  if (error) {
    console.error('Threads returned error:', error);
    return res.redirect(`/?error=threads_${error}`);
  }

  // Verify state parameter
  if (!state || state !== req.session.threadsOAuthState) {
    console.error('State parameter mismatch or missing');
    console.log('Expected state:', req.session.threadsOAuthState);
    console.log('Received state:', state);
    return res.redirect('/?error=threads_invalid_state');
  }

  // Clear the state from session after verification
  delete req.session.threadsOAuthState;

  if (!code || typeof code !== 'string') {
    console.error('No authorization code in callback');
    return res.redirect('/?error=threads_no_code');
  }

  if (!THREADS_CLIENT_ID || !THREADS_CLIENT_SECRET) {
    console.error('Threads OAuth not configured properly');
    return res.redirect('/?error=threads_config_error');
  }

  try {
    console.log('Exchanging authorization code for access token...');
    
    const tokenResponse = await fetch('https://graph.threads.net/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: THREADS_CLIENT_ID,
        client_secret: THREADS_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: THREADS_REDIRECT_URI,
        code: code
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json() as any;
    const { access_token, user_id } = tokenData;
    
    console.log('Token received:', { 
      hasToken: !!access_token, 
      userId: user_id 
    });

    if (!access_token || !user_id) {
      throw new Error('Missing access_token or user_id from Threads API');
    }

    console.log('Fetching Threads user profile...');
    
    const profileUrl = new URL(`https://graph.threads.net/v1.0/${user_id}`);
    profileUrl.searchParams.append('fields', 'id,username,name,threads_profile_picture_url');
    profileUrl.searchParams.append('access_token', access_token);
    
    const profileResponse = await fetch(profileUrl.toString());

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('Profile fetch failed:', profileResponse.status, errorText);
      throw new Error(`Profile fetch failed: ${profileResponse.status}`);
    }

    const userProfile = await profileResponse.json() as any;
    console.log('Threads profile received:', {
      id: userProfile.id,
      username: userProfile.username,
      name: userProfile.name
    });

    req.session.threadsAuth = {
      platform: 'threads',
      userId: userProfile.id,
      username: userProfile.username,
      name: userProfile.name,
      profilePicture: userProfile.threads_profile_picture_url,
      accessToken: access_token,
      connectedAt: new Date().toISOString()
    };

    console.log('Threads auth stored in session, linked to user:', req.user);

    req.session.save((saveErr) => {
      if (saveErr) {
        console.error('Session save error:', saveErr);
        return res.redirect('/?error=threads_session_failed');
      }
      
      console.log('Threads connection successful, redirecting...');
      const redirectUrl = process.env.CLIENT_URL || `https://${req.get('host')}`;
      res.redirect(`${redirectUrl}?threads_connected=true`);
    });

  } catch (error) {
    console.error('Threads OAuth error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    res.redirect('/?error=threads_auth_failed');
  }
});

router.get('/threads/status', (req: Request, res: Response) => {
  console.log('=== Threads Status Check ===');
  console.log('Session ID:', req.sessionID);
  console.log('Has Threads auth:', !!req.session?.threadsAuth);
  
  if (req.session?.threadsAuth) {
    res.json({
      connected: true,
      username: req.session.threadsAuth.username,
      userId: req.session.threadsAuth.userId,
      connectedAt: req.session.threadsAuth.connectedAt
    });
  } else {
    res.json({
      connected: false
    });
  }
});

router.post('/threads/disconnect', (req: Request, res: Response) => {
  console.log('=== Disconnecting Threads ===');
  console.log('User:', req.user);
  
  if (req.session?.threadsAuth) {
    delete req.session.threadsAuth;
    req.session.save((err) => {
      if (err) {
        console.error('Failed to save session after disconnect:', err);
        return res.status(500).json({ error: 'Failed to disconnect Threads' });
      }
      console.log('Threads disconnected successfully');
      res.json({ success: true });
    });
  } else {
    res.json({ success: true, message: 'Threads was not connected' });
  }
});

router.get('/user', (req: Request, res: Response) => {
  console.log('=== AUTH CHECK DEBUG ===');
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  console.log('User object:', req.user);
  console.log('Is authenticated:', req.isAuthenticated?.());
  console.log('Cookies:', req.headers.cookie);
  
  let userData = null;
  if (req.user) {
    const user = req.user as any;
    userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName || user.name?.split(' ')[0] || '',
      lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
      google_id: user.google_id,
      created_at: user.created_at,
      updated_at: user.updated_at,
      threadsConnected: !!req.session?.threadsAuth,
      threadsUsername: req.session?.threadsAuth?.username || null
    };
  }

  const responseData = {
    authenticated: !!req.user,
    user: userData,
    threadsAuth: req.session?.threadsAuth ? {
      connected: true,
      username: req.session.threadsAuth.username,
      userId: req.session.threadsAuth.userId
    } : {
      connected: false
    },
    debug: {
      sessionId: req.sessionID,
      hasSession: !!req.session,
      hasUser: !!req.user,
      hasThreads: !!req.session?.threadsAuth
    }
  };
  
  res.json(responseData);
});

router.post('/logout', (req: Request, res: Response) => {
  console.log('=== Logout Debug ===');
  console.log('User before logout:', req.user);
  
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ error: 'Session cleanup failed' });
      }
      
      res.clearCookie('connect.sid');
      res.clearCookie('streamscene.sid');
      console.log('Logout successful');
      res.json({ message: 'Logged out successfully' });
    });
  });
});

export default router;