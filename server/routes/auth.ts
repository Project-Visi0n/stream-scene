import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';

const router = express.Router();

// Test route
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Auth routes are working!' });
});

// Add debug middleware to see ALL requests
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[AUTH] ${req.method} ${req.path}`, {
    query: req.query,
    headers: req.get('host'),
    session: req.sessionID
  });
  next();
});

// Initiate Google OAuth
router.get(
  '/google',
  (req: Request, res: Response, next: NextFunction) => {
    console.log('=== Google OAuth Debug ===');
    console.log('Host:', req.get('host'));
    console.log('Protocol:', req.protocol);
    console.log('Original URL:', req.originalUrl);
    console.log('Full URL:', `${req.protocol}://${req.get('host')}${req.originalUrl}`);
    // Remove these sensitive logs in production:
    // console.log('Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + '...');
    // console.log('Callback URL:', process.env.GOOGLE_CALLBACK_URL);
    console.log('OAuth initiation started...');
    next();
  },
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback - Enhanced debugging
router.get(
  '/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
    console.log('=== Google Callback Started ===');
    console.log('Query params:', req.query);
    
    // Check for OAuth errors from Google
    if (req.query.error) {
      console.error('Google returned error:', req.query.error);
      return res.redirect(`/?error=${req.query.error}`);
    }
    
    // Check for authorization code
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
      
      // Log the user in
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('Login error:', loginErr);
          return res.redirect('/?error=login_failed');
        }
        
        console.log('Login successful, saving session...');
        
        // Explicitly save session
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.redirect('/?error=session_failed');
          }
          
          console.log('Session saved, redirecting to client...');
          const redirectUrl = process.env.CLIENT_URL || `http://${req.get('host')}`;
          console.log('Redirecting to:', redirectUrl);
          res.redirect(redirectUrl);
        });
      });
    })(req, res, next);
  }
);

// Get current authenticated user
router.get('/user', (req: Request, res: Response) => {
  console.log('=== AUTH CHECK DEBUG ===');
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  console.log('User object:', req.user);
  console.log('Is authenticated:', req.isAuthenticated?.());
  console.log('Cookies:', req.headers.cookie);
  
  res.json({
    authenticated: !!req.user,
    user: req.user || null,
    debug: {
      sessionId: req.sessionID,
      hasSession: !!req.session,
      hasUser: !!req.user
    }
  });
});

// Logout endpoint
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
      console.log('Logout successful');
      res.json({ message: 'Logged out successfully' });
    });
  });
});

export default router;