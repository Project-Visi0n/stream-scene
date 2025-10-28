import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import crypto from 'crypto';

const router = express.Router();

// Threads constants (leaving these in case you still use them elsewhere)
const THREADS_CLIENT_ID = process.env.THREADS_CLIENT_ID;
const THREADS_CLIENT_SECRET = process.env.THREADS_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || 'https://streamscene.net';
const THREADS_REDIRECT_URI = `${BASE_URL}/auth/threads/callback`;

// Simple test route
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Auth routes are working!' });
});

// Store recent auth errors for debugging
const recentAuthErrors: {timestamp: string, error: string, details?: unknown}[] = [];

// Debug endpoint to check environment and database
router.get('/debug', async (req: Request, res: Response) => {
  try {
    // Import User model to test database connection
    const { User } = await import('../models/User.js');
    
    // Test database connection
    const userCount = await User.count();
    
    res.json({
      message: 'Debug info',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasSessionSecret: !!process.env.SESSION_SECRET,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL,
        clientUrl: process.env.CLIENT_URL,
        dbHost: process.env.DB_HOST,
        dbName: process.env.DB_NAME,
        hasDbPass: !!process.env.DB_PASS
      },
      database: {
        connected: true,
        userCount: userCount
      },
      recentAuthErrors: recentAuthErrors.slice(-5) // Show last 5 errors
    });
  } catch (error) {
    res.status(500).json({
      message: 'Debug error',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasSessionSecret: !!process.env.SESSION_SECRET
      },
      database: {
        connected: false
      }
    });
  }
});

// ──────────────────────────────────────────
// GOOGLE OAUTH START
// ──────────────────────────────────────────

// Kick off Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get(
  '/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', (err: any, user: any, info: any) => {
      console.log('=== Passport Authenticate Result ===');
      console.log('Error:', err);
      console.log('User:', user ? 'User object present' : 'No user');
      console.log('Info:', info);

      if (err) {
        console.error('Authentication error:', err);
        // Store error for debugging
        recentAuthErrors.push({
          timestamp: new Date().toISOString(),
          error: 'Authentication error',
          details: err instanceof Error ? err.message : err
        });
        return res.redirect('/?error=auth_failed');
      }

      if (!user) {
        console.error('No user returned from authentication');
        // Store error for debugging
        recentAuthErrors.push({
          timestamp: new Date().toISOString(),
          error: 'No user returned from authentication',
          details: { info }
        });
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

          console.log('Session saved, preparing redirect...');

          // ─────────────────────────────
          // ✅ REDIRECT LOGIC (updated)
          // ─────────────────────────────
          //
          // We do NOT want to bounce the user to an ngrok URL anymore.
          //
          // Instead:
          // - In production, if you explicitly define CLIENT_URL in .env,
          //   we'll trust that.
          // - In development, we ALWAYS send them back to localhost:8000
          //   so that the browser stays on the same origin that issued
          //   the session cookie.
          //
          // This fixes the "Google login works but you're still not authenticated"
          // bug that Bradley saw.

          const isProd =
            process.env.NODE_ENV === 'production' ||
            process.env.NODE_ENV === 'prod';

          const LOCAL_DEV_URL = 'http://localhost:8000';
          const envClient = process.env.CLIENT_URL; // e.g. real deployed frontend

          const redirectUrl =
            (isProd && envClient)
              ? envClient
              : LOCAL_DEV_URL;

          console.log('Redirecting to:', redirectUrl);
          return res.redirect(redirectUrl);
        });
      });
    })(req, res, next);
  }
);

// ──────────────────────────────────────────
// GOOGLE OAUTH END
// ──────────────────────────────────────────



// ──────────────────────────────────────────
// DEMO LOGIN (dev / presentation mode only)
// ──────────────────────────────────────────
//
// This lets you log in as a specific demo user without Google OAuth.
// To use this in production you'd WANT THIS LOCKED DOWN HARD,
// but for your current flow it's helpful.

router.post('/demo-login', async (req: Request, res: Response) => {
  // Allow demo login in development OR if ALLOW_DEMO_LOGIN=true
  const isDemoAllowed =
    process.env.NODE_ENV === 'development' ||
    process.env.ALLOW_DEMO_LOGIN === 'true';

  if (!isDemoAllowed) {
    return res.status(403).json({ error: 'Demo login disabled' });
  }

  try {
    // Lazy-import models so we don't create circular deps at load time
    const { User } = await import('../models/User.js');

    // Find the seeded demo user
    const demoUser = await User.findOne({
      where: { email: 'allblk13@gmail.com' }
    });

    if (!demoUser) {
      return res.status(404).json({
        error: 'Demo user not found. Please run seed script first.'
      });
    }

    // Log in the demo user and also reset demo data
    req.logIn(demoUser, (err) => {
      if (err) {
        console.error('Demo login error:', err);
        return res.status(500).json({ error: 'Demo login failed' });
      }

      // Wrap reset in an IIFE so we can await inside
      (async () => {
        try {
          // Reset tasks
          const { Task } = await import('../models/Task.js');

          await Task.destroy({ where: { user_id: demoUser.id } });

          const now = Date.now();
          const days = (n: number) =>
            new Date(now + n * 24 * 60 * 60 * 1000);

          const demoTasks = [
            {
              title: 'Welcome to StreamScene',
              description:
                'Explore the collaborative features and get started with your first project!',
              priority: 'medium',
              task_type: 'admin',
              status: 'pending',
              deadline: days(7),
              estimated_hours: 2,
              user_id: demoUser.id,
            },
            {
              title: 'Tech Review Script',
              description: 'Write script for iPhone 16 review video',
              priority: 'high',
              task_type: 'creative',
              status: 'in_progress',
              deadline: days(0),
              estimated_hours: 4,
              user_id: demoUser.id,
            },
            {
              title: 'Thumbnail Design',
              description: 'Create eye-catching thumbnail for review video',
              priority: 'medium',
              task_type: 'creative',
              status: 'pending',
              deadline: days(1),
              estimated_hours: 2,
              user_id: demoUser.id,
            },
            {
              title: 'Brand Partnership Meeting',
              description:
                'Video call with Sony about camera gear sponsorship',
              priority: 'high',
              task_type: 'admin',
              status: 'pending',
              deadline: days(3),
              estimated_hours: 1,
              user_id: demoUser.id,
            },
            {
              title: 'Content Calendar Planning',
              description: 'Plan next month content strategy',
              priority: 'medium',
              task_type: 'admin',
              status: 'pending',
              deadline: days(7),
              estimated_hours: 3,
              user_id: demoUser.id,
            },
            {
              title: 'SEO Optimization',
              description:
                'Optimized video titles and descriptions',
              priority: 'medium',
              task_type: 'admin',
              status: 'completed',
              deadline: days(-3),
              estimated_hours: 2,
              user_id: demoUser.id,
            },
          ];

          await Task.bulkCreate(demoTasks as any);

          // Reset budget data
          const { default: BudgetProject } = await import('../models/BudgetProject.js');
          const { default: BudgetEntry } = await import('../models/BudgetEntry.js');

          await BudgetEntry.destroy({ where: { user_id: demoUser.id } });
          await BudgetProject.destroy({ where: { user_id: demoUser.id } });

          const demoProjects = [
            {
              user_id: demoUser.id,
              name: 'YouTube Channel',
              description:
                'Main content creation expenses and revenue',
              color: '#ff6b6b',
              is_active: true,
              tags: ['content', 'youtube', 'main']
            },
            {
              user_id: demoUser.id,
              name: 'Equipment Fund',
              description:
                'Camera gear and tech equipment purchases',
              color: '#4ecdc4',
              is_active: true,
              tags: ['equipment', 'gear', 'investment']
            },
            {
              user_id: demoUser.id,
              name: 'Business Operations',
              description:
                'General business and operational expenses',
              color: '#45b7d1',
              is_active: true,
              tags: ['business', 'operations', 'overhead']
            }
          ];

          const createdProjects = await BudgetProject.bulkCreate(demoProjects);

          const demoEntries = [
            // Income
            {
              user_id: demoUser.id,
              type: 'income',
              amount: 2500.0,
              category: 'YouTube Revenue',
              description: 'Monthly AdSense revenue',
              date: days(-5),
              project_id: createdProjects[0].id,
              tags: ['adsense', 'monthly', 'recurring']
            },
            {
              user_id: demoUser.id,
              type: 'income',
              amount: 1800.0,
              category: 'Sponsorship',
              description: 'Brand partnership payment',
              date: days(-10),
              project_id: createdProjects[0].id,
              tags: ['sponsorship', 'brand', 'partnership']
            },
            {
              user_id: demoUser.id,
              type: 'income',
              amount: 350.0,
              category: 'Merchandise',
              description: 'T-shirt and sticker sales',
              date: days(-15),
              project_id: createdProjects[0].id,
              tags: ['merchandise', 'merch', 'sales']
            },

            // Expenses
            {
              user_id: demoUser.id,
              type: 'expense',
              amount: 1299.99,
              category: 'Equipment',
              description: 'Sony A7IV Camera Body',
              date: days(-20),
              project_id: createdProjects[1].id,
              receipt_title: 'Sony A7IV Purchase',
              ocr_scanned: true,
              ocr_confidence: 0.95,
              tags: ['camera', 'equipment', 'gear']
            },
            {
              user_id: demoUser.id,
              type: 'expense',
              amount: 89.99,
              category: 'Software',
              description: 'Adobe Creative Suite subscription',
              date: days(-1),
              project_id: createdProjects[2].id,
              tags: ['software', 'subscription', 'monthly']
            },
            {
              user_id: demoUser.id,
              type: 'expense',
              amount: 45.5,
              category: 'Office Supplies',
              description: 'SD cards and batteries',
              date: days(-7),
              project_id: createdProjects[1].id,
              tags: ['supplies', 'accessories', 'gear']
            },
            {
              user_id: demoUser.id,
              type: 'expense',
              amount: 25.0,
              category: 'Transportation',
              description: 'Gas for location shooting',
              date: days(-3),
              project_id: createdProjects[0].id,
              tags: ['gas', 'transportation', 'location']
            }
          ];

          await BudgetEntry.bulkCreate(demoEntries as any);

        } catch (taskTrimErr) {
          console.error('Demo data reset failed:', taskTrimErr);
          // We still continue to log them in
        } finally {
          console.log('Demo login successful for:', demoUser.email);

          res.json({
            message: 'Demo login successful',
            user: {
              id: demoUser.id,
              email: demoUser.email,
              name: demoUser.name,
            },
          });
        }
      })();
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

// ──────────────────────────────────────────
// CURRENT USER
// ─────────────────────────────────────────-

router.get('/user', (req: Request, res: Response) => {
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
      threadsUsername: req.session?.threadsAuth?.username || null,
    };
  }

  const responseData = {
    authenticated: !!req.user,
    user: userData,
    threadsAuth: req.session?.threadsAuth
      ? {
          connected: true,
          username: req.session.threadsAuth.username,
          userId: req.session.threadsAuth.userId,
        }
      : {
          connected: false,
        },
    debug: {
      sessionId: req.sessionID,
      hasSession: !!req.session,
      hasUser: !!req.user,
      hasThreads: !!req.session?.threadsAuth,
    },
  };

  res.json(responseData);
});

// ──────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────-

router.post('/logout', (req: Request, res: Response) => {
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
