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
  passport.authenticate('google', { failureRedirect: '/' }),
  (req: Request, res: Response) => {
    res.redirect('/dashboard');
  }
);

export default router;