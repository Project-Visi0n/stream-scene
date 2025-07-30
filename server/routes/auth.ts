import express, { Request, Response, NextFunction } from 'express';
import passport from '../config/passport';

const router = express.Router();

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
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req: Request, res: Response) => {
    res.redirect('http://localhost:3001/dashboard');
  }
);

// Logout route
router.get('/logout', (req: Request, res: Response, next: NextFunction) => {
  try {
    req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('http://localhost:3001');
  });
} catch (err) {
  next (err);
});

// Check if user is authenticated
router.get('/user', (req: Request, res: Response) => {
  if (req.isAuthenticated() && req.user) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        profilePicture: req.user.profilePicture
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

export default router;
