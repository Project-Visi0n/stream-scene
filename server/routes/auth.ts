import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';

const router = express.Router();

// Test route
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Auth routes are working!' });
});

// Extend Request interface to include user
declare global {
  namespace Express {
    interface User {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      googleId?: string;
      profilePicture?: string;
    }
  }
}

// Initiate Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get(
 '/google/callback',
 (req: Request, res: Response, next: NextFunction) => {
   console.log('Callback received - Query params:', req.query);
   console.log('Callback received - Headers:', req.headers);
   next();
 },
 passport.authenticate('google', { 
   failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:8000'}/?error=auth_failed`,
   successRedirect: process.env.CLIENT_URL || 'http://localhost:8000'
 })
);

// Get current authenticated user
router.get('/user', (req: Request, res: Response) => {
  console.log('Auth check - Session ID:', req.sessionID);
  console.log('Auth check - User:', req.user);
  console.log('Auth check - Session:', req.session);
  
  if (req.user) {
    res.json({
      authenticated: true,
      user: req.user
    });
  } else {
    res.json({
      authenticated: false,
      user: null
    });
  }
});

// Logout endpoint
router.post('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

export default router;