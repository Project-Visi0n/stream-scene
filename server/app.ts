import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer } from 'http';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment-specific config
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
const envPath = path.resolve(process.cwd(), envFile);

console.log(`🔧 Loading environment from: ${envFile}`);
dotenv.config({ path: envPath });

// Fallback to main .env if specific env file doesn't exist
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import express from "express";
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import "./config/passport.js";
import authRoutes from "./routes/auth.js";
import routes from "./routes/index.js";
import budgetRoutes from "./routes/budget-minimal.js";
import aiRoutes from "./routes/ai.js";
import scheduleRoutes from "./routes/schedule.js";
import s3ProxyRoutes from "./routes/s3Proxy.js";
import filesRoutes from "./routes/files.js";
import sharesRoutes from "./routes/shares.js";
import socialAuthRoutes from './routes/socialAuth.js';
import { syncDB } from "./db/index.js";
import captionRouter from './routes/caption.js';
import { initializeWebSocket } from './services/WebSocketService.js';

const app = express();

// Trust proxy for secure cookies behind HTTPS load balancers (e.g., Render, Vercel, Cloudflare)
app.set('trust proxy', 1);

// Handle Cloudflare headers for proper protocol detection
app.use((req, res, next) => {
  // If behind Cloudflare or other proxy that sets these headers
  if (req.headers['cf-visitor']) {
    try {
      const cfVisitor = JSON.parse(req.headers['cf-visitor'] as string);
      if (cfVisitor.scheme === 'https') {
        req.headers['x-forwarded-proto'] = 'https';
      }
    } catch (e) {
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
    if (!isProd && origin && (
      origin.includes('localhost') || 
      origin.includes('127.0.0.1') || 
      origin.includes('0.0.0.0')
    )) {
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
      if (!allowed) return false;
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
  const timestamp = new Date().toISOString();
  console.log(`📡 ${timestamp} - ${req.method} ${req.path}`, {
    origin: req.headers.origin || 'NO_ORIGIN',
    userAgent: req.headers['user-agent']?.substring(0, 50) + '...',
    referer: req.headers.referer || 'NO_REFERER',
    host: req.headers.host,
    user: req.user ? 'authenticated' : 'not authenticated',
    sessionID: req.sessionID || 'NO_SESSION'
  });
  next();
});

// Security headers middleware - add CSP to handle dynamic script loading
app.use((req, res, next) => {
  // More permissive CSP that allows Facebook/Meta OAuth flows while maintaining security
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:",
    "style-src 'self' 'unsafe-inline' https:",
    "font-src 'self' https: data:",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https: blob: data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https:",
    "frame-ancestors 'none'",
    "connect-src 'self' https: wss: ws: data: blob: https://streamscene.net wss://streamscene.net",
    "worker-src 'self' blob:",
    "manifest-src 'self'"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  
  // Additional security headers
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware - FIXED configuration for OAuth flows
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production',
  resave: false,
  saveUninitialized: true,  // Changed to true to ensure session is created before OAuth
  name: 'streamscene.sid',  // Custom cookie name
  cookie: {
    secure: isProd,  // HTTPS cookies in production, HTTP in development
    httpOnly: true,
    sameSite: 'lax',  // Changed from 'none' to 'lax' for better OAuth compatibility
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
    domain: isProd ? '.streamscene.net' : undefined  // Allow subdomain cookies in production
  }
}));

// Session debugging middleware (remove in production later)
app.use((req, res, next) => {
  console.log('📝 Session Debug:', {
    sessionID: req.sessionID,
    hasSession: !!req.session,
    sessionData: req.session ? Object.keys(req.session) : [],
    threadsOAuthState: req.session?.threadsState ? 'present' : 'missing',
    cookie: req.headers.cookie ? 'present' : 'missing'
  });
  next();
});

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
app.use('/api/budget', budgetRoutes);
app.use('/', routes);
app.use('/api/ai', aiRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/s3', s3ProxyRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/shares', sharesRoutes);
app.use('/api/caption', captionRouter);
// Note: All other API routes (tasks, content-scheduler, threads, budget, etc.) are mounted in routes/index.ts


// Serve static files from public directory
const publicPath = __dirname.includes('dist/server')
  ? path.join(__dirname, '../../public') 
  : path.join(__dirname, '../public');

console.log(`📁 Static files served from: ${publicPath}`);
console.log(`📁 Static directory exists: ${fs.existsSync(publicPath)}`);

// Add request logging middleware for debugging
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    if (req.path.endsWith('.js') || req.path.endsWith('.css')) {
      console.log(`🔍 Static file request: ${req.method} ${req.path}`);
    }
    next();
  });
}

// Configure static file serving with proper options
app.use(express.static(publicPath, {
  // Set proper MIME types
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    }
  },
  // Add cache control for production
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
}));

// API test route
app.get('/test-server', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Debug route to test budget endpoints directly
app.get('/debug-budget', (req, res) => {
  res.json({ 
    message: 'Budget debug route working from app.ts!',
    timestamp: new Date().toISOString(),
    routes_mounted: true,
    path: req.path,
    originalUrl: req.originalUrl,
    method: req.method
  });
});

// Debug route to show route mounting info
app.get('/debug-routing', (req, res) => {
  res.json({
    message: 'Route debugging info',
    mountOrder: [
      '1. /auth -> authRoutes',
      '2. /social -> socialAuthRoutes', 
      '3. / -> routes (from index.ts) - THIS CATCHES ALL!',
      '4. /api/ai -> aiRoutes',
      '5. /api/schedule -> scheduleRoutes',
      '6. /api/s3 -> s3ProxyRoutes',
      '7. /api/files -> filesRoutes',
      '8. /api/shares -> sharesRoutes',
      '9. /api/caption -> captionRouter'
    ],
    note: 'Budget routes should be in step 3 (routes/index.ts)',
    timestamp: new Date().toISOString()
  });
});

// Catch-all: serve frontend app unless it's an API route or static file
app.get('*', (req, res) => {
  // Skip catch-all for API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/') || req.path.startsWith('/social/')) {
    return res.status(404).json({ error: 'Route not found' });
  }
  
  // Skip catch-all for static files (let express.static handle them or return 404)
  const staticFileExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.map'];
  if (staticFileExtensions.some(ext => req.path.endsWith(ext))) {
    return res.status(404).send('File not found');
  }
  
  const indexPath = __dirname.includes('dist/server')
    ? path.join(__dirname, '../../public/index.html')  // For deployment
    : path.join(__dirname, '../public/index.html');    // For local dev
    
  if (!fs.existsSync(indexPath)) {
    console.error('index.html file not found at:', indexPath);
    return res.status(404).send('index.html file not found');
  }
  
  res.sendFile(indexPath);
});

const PORT = Number(process.env.PORT) || 8000;
const HOST = '0.0.0.0';

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket service
const webSocketService = initializeWebSocket(server);

// Initialize database and start server
syncDB().then(() => {
  server.listen(PORT, HOST, () => {
    const protocol = isProd ? 'https' : 'http';
    console.log(`Server is running at ${protocol}://localhost:${PORT}`);
    console.log(`External access: ${protocol}://${HOST}:${PORT}`);
    console.log(`Environment: ${isProd ? 'production' : 'development'}`);
    console.log(`🔌 WebSocket server initialized`);
  });
}).catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

export default app;
export { webSocketService };