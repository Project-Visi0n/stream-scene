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
    console.log('Callback received - Query params:', req.query);
    console.log('Callback received - Headers:', req.headers);
    next();
}, (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
        console.log('Passport authenticate result:', { err, user, info });
        if (err) {
            console.error('OAuth error:', err);
            return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:8000'}/?error=oauth_error`);
        }
        if (!user) {
            console.log('No user returned from OAuth');
            return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:8000'}/?error=auth_failed`);
        }
        req.logIn(user, (loginErr) => {
            if (loginErr) {
                console.error('Login error:', loginErr);
                return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:8000'}/?error=login_failed`);
            }
            console.log('OAuth success - User:', user);
            console.log('OAuth success - Session:', req.session);
            return res.redirect(process.env.CLIENT_URL || 'http://localhost:8000/');
        });
    })(req, res, next);
});
// Get current authenticated user
router.get('/user', (req, res) => {
    console.log('Auth check - Session ID:', req.sessionID);
    console.log('Auth check - User:', req.user);
    console.log('Auth check - Session:', req.session);
    if (req.user) {
        res.json({
            authenticated: true,
            user: req.user
        });
    }
    else {
        res.json({
            authenticated: false,
            user: null
        });
    }
});
// Logout endpoint
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});
export default router;
