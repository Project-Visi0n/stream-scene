import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';

const router = express.Router();

// Test route
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Auth routes are working!' });
});



// Initiate Google OAuth
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
          const redirectUrl = process.env.CLIENT_URL || `https://${req.get('host')}`;
          console.log('Redirecting to:', redirectUrl);
          res.redirect(redirectUrl);
        });
      });
    })(req, res, next);
  }
);

// Demo login for development/presentation (controlled by environment)
router.post('/demo-login', async (req: Request, res: Response) => {
  // Allow demo login in development OR if ALLOW_DEMO_LOGIN is set to true
  const isDemoAllowed = process.env.NODE_ENV === 'development' || process.env.ALLOW_DEMO_LOGIN === 'true';
  
  if (!isDemoAllowed) {
    return res.status(403).json({ error: 'Demo login disabled' });
  }
  
  try {
    // Import User model
    const { User } = await import('../models/User.js');
    
    // Find the demo user created in seed data
    const demoUser = await User.findOne({
      where: { email: 'allblk13@gmail.com' }
    });
    
    if (!demoUser) {
      return res.status(404).json({ error: 'Demo user not found. Please run seed script first.' });
    }
    
    // Log in the demo user
    req.logIn(demoUser, (err) => {
      if (err) {
        console.error('Demo login error:', err);
        return res.status(500).json({ error: 'Demo login failed' });
      }

      // Always reset demo tasks on demo-login to ensure consistent demo experience
      (async () => {
        try {
          const { Task } = await import('../models/Task.js');

          // Always remove existing demo user's tasks and insert a fresh, minimal set
          await Task.destroy({ where: { user_id: demoUser.id } });

          const now = Date.now();
          const days = (n: number) => new Date(now + n * 24 * 60 * 60 * 1000);

          const demoTasks = [
            {
              title: 'Welcome to StreamScene',
              description: 'Explore the collaborative features and get started with your first project!',
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
              description: 'Video call with Sony about camera gear sponsorship',
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
              description: 'Optimized video titles and descriptions',
              priority: 'medium',
              task_type: 'admin',
              status: 'completed',
              deadline: days(-3),
              estimated_hours: 2,
              user_id: demoUser.id,
            },
          ];

          await Task.bulkCreate(demoTasks as any);

          // Reset budget data for consistent demo experience
          const { default: BudgetProject } = await import('../models/BudgetProject.js');
          const { default: BudgetEntry } = await import('../models/BudgetEntry.js');

          // Clear existing budget data
          await BudgetEntry.destroy({ where: { user_id: demoUser.id } });
          await BudgetProject.destroy({ where: { user_id: demoUser.id } });

          // Create demo budget projects
          const demoProjects = [
            {
              user_id: demoUser.id,
              name: 'YouTube Channel',
              description: 'Main content creation expenses and revenue',
              color: '#ff6b6b',
              is_active: true,
              tags: ['content', 'youtube', 'main']
            },
            {
              user_id: demoUser.id,
              name: 'Equipment Fund',
              description: 'Camera gear and tech equipment purchases',
              color: '#4ecdc4',
              is_active: true,
              tags: ['equipment', 'gear', 'investment']
            },
            {
              user_id: demoUser.id,
              name: 'Business Operations',
              description: 'General business and operational expenses',
              color: '#45b7d1',
              is_active: true,
              tags: ['business', 'operations', 'overhead']
            }
          ];

          const createdProjects = await BudgetProject.bulkCreate(demoProjects);

          // Create demo budget entries
          const demoEntries = [
            // Income entries
            {
              user_id: demoUser.id,
              type: 'income',
              amount: 2500.00,
              category: 'YouTube Revenue',
              description: 'Monthly AdSense revenue',
              date: days(-5),
              project_id: createdProjects[0].id,
              tags: ['adsense', 'monthly', 'recurring']
            },
            {
              user_id: demoUser.id,
              type: 'income',
              amount: 1800.00,
              category: 'Sponsorship',
              description: 'Brand partnership payment',
              date: days(-10),
              project_id: createdProjects[0].id,
              tags: ['sponsorship', 'brand', 'partnership']
            },
            {
              user_id: demoUser.id,
              type: 'income',
              amount: 350.00,
              category: 'Merchandise',
              description: 'T-shirt and sticker sales',
              date: days(-15),
              project_id: createdProjects[0].id,
              tags: ['merchandise', 'merch', 'sales']
            },
            // Expense entries
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
              amount: 45.50,
              category: 'Office Supplies',
              description: 'SD cards and batteries',
              date: days(-7),
              project_id: createdProjects[1].id,
              tags: ['supplies', 'accessories', 'gear']
            },
            {
              user_id: demoUser.id,
              type: 'expense',
              amount: 25.00,
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
          // Proceed with login even if data reset fails
        } finally {
          console.log('Demo login successful for:', demoUser.email);
          res.json({
            message: 'Demo login successful',
            user: {
              id: demoUser.id,
              email: demoUser.email,
              name: demoUser.name
            }
          });
        }
      })();
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

// Get current authenticated user
router.get('/user', (req: Request, res: Response) => {
  let userData = null;
  if (req.user) {
    // Cast to User type to access getters
    const user = req.user as any;
    userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName || user.name?.split(' ')[0] || '',
      lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
      google_id: user.google_id,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }

  const responseData = {
    authenticated: !!req.user,
    user: userData,
    debug: {
      sessionId: req.sessionID,
      hasSession: !!req.session,
      hasUser: !!req.user
    }
  };
  
  res.json(responseData);
});

// Logout endpoint
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
      console.log('Logout successful');
      res.json({ message: 'Logged out successfully' });
    });
  });
});

export default router;