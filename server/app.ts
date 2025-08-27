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

const app = express();

// Trust proxy for secure cookies behind HTTPS load balancers (e.g., Render, Vercel)
app.set('trust proxy', 1);

// Environment check
const isProd = process.env.NODE_ENV === 'production';

// CORS configuration - fixed to be more specific
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8000',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8000',
  'http://127.0.0.1:8080',
  'http://0.0.0.0:3000',
  'http://0.0.0.0:8000',
  'http://0.0.0.0:8080',
  // Production domains
  'http://streamscene.net',
  'https://streamscene.net',
  'http://streamscene.net:8000',
  'https://streamscene.net:8000'
];

// Add production origins if they exist
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
if (process.env.PRODUCTION_URL) {
  allowedOrigins.push(process.env.PRODUCTION_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With']
}));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware - production-ready configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,  // HTTPS cookies in production, HTTP in development
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',  // 'none' for cross-domain in production
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
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

// Serve static files from public directory
const publicPath = __dirname.includes('dist/server')
  ? path.join(__dirname, '../../public') 
  : path.join(__dirname, '../public');
    
app.use(express.static(publicPath));

// Routes
app.use('/auth', authRoutes);
app.use('/auth', socialAuthRoutes);
app.use('/', routes);
app.use('/api/ai', aiRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/s3', s3ProxyRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/shares', sharesRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/threads', threadsRoutes);
app.use('/api/caption', captionRouter);

// API test route
app.get('/test-server', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Catch-all: serve frontend app unless it's an API route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
    return res.status(404).json({ error: 'Route not found' });
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

// Initialize database and start server
syncDB().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`External access: http://${HOST}:${PORT}`);
    console.log(`Environment: ${isProd ? 'production' : 'development'}`);
    console.log(`Allowed CORS origins:`, allowedOrigins);
  });
}).catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

export default app;