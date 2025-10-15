import express from 'express';
import passport from 'passport';
const router = express.Router();
// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Auth routes are working!' });
});
// Initiate Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// Google OAuth callback
router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
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
});
// Demo login for development/presentation (controlled by environment)
router.post('/demo-login', async (req, res) => {
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
            console.log('Demo login successful for:', demoUser.email);
            res.json({
                message: 'Demo login successful',
                user: {
                    id: demoUser.id,
                    email: demoUser.email,
                    name: demoUser.name
                }
            });
        });
    }
    catch (error) {
        console.error('Demo login error:', error);
        res.status(500).json({ error: 'Demo login failed' });
    }
});
// Get current authenticated user
router.get('/user', (req, res) => {
    var _a, _b;
    let userData = null;
    if (req.user) {
        // Cast to User type to access getters
        const user = req.user;
        userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            firstName: user.firstName || ((_a = user.name) === null || _a === void 0 ? void 0 : _a.split(' ')[0]) || '',
            lastName: user.lastName || ((_b = user.name) === null || _b === void 0 ? void 0 : _b.split(' ').slice(1).join(' ')) || '',
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
router.post('/logout', (req, res) => {
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
