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
import routes from "./routes/index.js";
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
import taskRoutes from './routes/tasks.js';
import contentSchedulerRoutes from './routes/contentScheduler.js';
const app = express();
// Trust proxy for secure cookies behind HTTPS load balancers (e.g., Render, Vercel, Cloudflare)
app.set('trust proxy', 1);
// Handle Cloudflare headers for proper protocol detection
app.use((req, res, next) => {
    // If behind Cloudflare or other proxy that sets these headers
    if (req.headers['cf-visitor']) {
        try {
            const cfVisitor = JSON.parse(req.headers['cf-visitor']);
            if (cfVisitor.scheme === 'https') {
                req.headers['x-forwarded-proto'] = 'https';
            }
        }
        catch (e) {
            // Ignore JSON parse errors
        }
    }
    next();
});
// Environment check
const isProd = process.env.NODE_ENV === 'production';
// Enhanced CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        const timestamp = new Date().toISOString();
        console.log(`🔍 [${timestamp}] CORS check for origin:`, origin);
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log('✅ No origin - allowing');
            return callback(null, true);
        }
        // Get allowed origins from environment variables
        const allowedOrigins = [
            process.env.CLIENT_URL,
            process.env.FRONTEND_URL,
            'https://streamscene.net',
            'https://www.streamscene.net'
        ].filter(Boolean); // Remove undefined/empty values
        // Allow localhost on any port for development
        if (!isProd && origin && (origin.includes('localhost') ||
            origin.includes('127.0.0.1') ||
            origin.includes('0.0.0.0'))) {
            console.log('✅ Origin allowed (localhost):', origin);
            return callback(null, true);
        }
        // Allow EC2 instance IP in production
        if (origin.includes('3.20.172.151')) {
            console.log('✅ Origin allowed (EC2):', origin);
            return callback(null, true);
        }
        // Allow streamscene.net WITH and WITHOUT www
        if (origin.includes('streamscene.net')) {
            console.log('✅ Origin allowed (streamscene):', origin);
            return callback(null, true);
        }
        // Check if origin is in allowed list
        if (origin && allowedOrigins.some(allowed => {
            if (!allowed)
                return false;
            return origin === allowed ||
                origin.startsWith(allowed) ||
                origin.includes(allowed.replace(/^https?:\/\//, ''));
        })) {
            console.log('✅ Origin allowed (environment):', origin);
            return callback(null, true);
        }
        // Log blocked origins for debugging
        console.log(`❌ [${timestamp}] CORS BLOCKED origin:`, origin);
        if (!isProd) {
            console.log('❌ Allowed origins:', allowedOrigins);
            console.trace();
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With']
}));
// Enhanced request logging middleware
app.use((req, res, next) => {
    var _a;
    const timestamp = new Date().toISOString();
    console.log(`📡 ${timestamp} - ${req.method} ${req.path}`, {
        origin: req.headers.origin || 'NO_ORIGIN',
        userAgent: ((_a = req.headers['user-agent']) === null || _a === void 0 ? void 0 : _a.substring(0, 50)) + '...',
        referer: req.headers.referer || 'NO_REFERER',
        host: req.headers.host,
        user: req.user ? 'authenticated' : 'not authenticated'
    });
    next();
});
// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Session middleware - environment-aware configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProd,
        httpOnly: true,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
// Debug middleware to log requests (remove in production)
if (!isProd) {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`, {
            origin: req.headers.origin,
            user: req.user ? 'authenticated' : 'not authenticated'
        });
        next();
    });
}
// API routes MUST come before static file serving
app.use('/auth', authRoutes);
app.use('/social', socialAuthRoutes);
app.use('/', routes);
app.use('/api/ai', aiRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/content-scheduler', contentSchedulerRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/s3', s3ProxyRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/shares', sharesRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/threads', threadsRoutes);
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
// Catch-all: serve frontend app unless it's an API route
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/') || req.path.startsWith('/social/')) {
        return res.status(404).json({ error: 'Route not found' });
    }
    const indexPath = __dirname.includes('dist/server')
        ? path.join(__dirname, '../../public/index.html') // For deployment
        : path.join(__dirname, '../public/index.html'); // For local dev
    if (!fs.existsSync(indexPath)) {
        console.error('index.html file not found at:', indexPath);
        return res.status(404).send('index.html file not found');
    }
    res.sendFile(indexPath);
});
const PORT = Number(process.env.PORT) || 8000;
const HOST = '0.0.0.0';
// Initialize database and start server
syncDB().then(() => {
    app.listen(PORT, HOST, () => {
        const protocol = isProd ? 'https' : 'http';
        console.log(`Server is running at ${protocol}://localhost:${PORT}`);
        console.log(`External access: ${protocol}://${HOST}:${PORT}`);
        console.log(`Environment: ${isProd ? 'production' : 'development'}`);
    });
}).catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
});
export default app;
