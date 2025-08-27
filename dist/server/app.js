import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import express from "express";
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import "./config/passport.js";
import authRoutes from "./routes/auth.js";
import aiRoutes from "./routes/ai.js";
import scheduleRoutes from "./routes/schedule.js";
import s3ProxyRoutes from "./routes/s3Proxy.js";
import filesRoutes from "./routes/files.js";
import sharesRoutes from "./routes/shares.js";
import budgetRoutes from './routes/budget.js';
import socialAuthRoutes from './routes/socialAuth.js';
import threadsRoutes from './routes/threads.js';
import { syncDB } from "./db/index.js";
import captionRouter from './routes/caption.js';
import contentSchedulerRoutes from './routes/contentScheduler.js'; // ADD THIS LINE
const app = express();
// CORS configuration
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin)
            return callback(null, true);
        // Allow localhost on any port for development
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true);
        }
        // Allow EC2 instance IP
        if (origin.includes('3.20.172.151')) {
            return callback(null, true);
        }
        // Allow streamscene.net WITH and WITHOUT www
        if (origin.includes('streamscene.net')) {
            return callback(null, true);
        }
        // Reject all others
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true // Allow cookies to be sent
}));
// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Session middleware (REQUIRED for Google OAuth AND Threads OAuth)
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
}));
// Passport middleware 
app.use(passport.initialize());
app.use(passport.session());
// API routes MUST come before static file serving
app.use('/auth', authRoutes); // Google OAuth routes
console.log('Auth routes loaded at /auth');
app.use('/social', socialAuthRoutes); // Threads OAuth routes - CHANGED PATH
app.use('/api', aiRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/content-scheduler', contentSchedulerRoutes); // ADD THIS LINE
app.use('/api/s3', s3ProxyRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/shares', sharesRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/threads', threadsRoutes); // Add Threads API routes
app.use('/api/caption', captionRouter);
// Serve static files from public directory
const publicPath = __dirname.includes('dist/server')
    ? path.join(__dirname, '../../public')
    : path.join(__dirname, '../public');
app.use(express.static(publicPath));
// API test route
app.get('/test-server', (req, res) => {
    res.json({ message: 'Server is working!' });
});
// Catch-all route for React SPA - must be last
app.get('*', (req, res) => {
    // Don't serve index.html for API or auth routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
        return res.status(404).json({ error: 'Route not found' });
    }
    const indexPath = __dirname.includes('dist/server')
        ? path.join(__dirname, '../../public/index.html')
        : path.join(__dirname, '../public/index.html');
    if (!fs.existsSync(indexPath)) {
        console.error('index.html file not found at:', indexPath);
        return res.status(404).send('index.html file not found');
    }
    res.sendFile(indexPath);
});
const PORT = Number(process.env.PORT) || 8000;
const HOST = '0.0.0.0';
// Initialize database
syncDB().then(() => {
    app.listen(PORT, HOST, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
        console.log(`External access: http://${HOST}:${PORT}`);
    });
}).catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
});
export default app;
