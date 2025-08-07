import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
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
import { syncDB } from "./db/index.js";

const app = express();

// CORS configuration
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow same domain for deployed environments
    const currentHost = process.env.HOST || 'localhost';
    if (origin.includes(currentHost)) {
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

// Session middleware (REQUIRED for Google OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware 
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../../public')));

// Auth routes 
app.use('/auth', authRoutes);
app.use('/', routes);
app.use('/api/ai', aiRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/s3', s3ProxyRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/shares', sharesRoutes);

// API test route
app.get('/test-server', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Catch-all handler for SPA routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
    return res.status(404).json({ error: 'Route not found' });
  }

  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

const PORT = Number(process.env.PORT) || 8000;
const HOST = '0.0.0.0'; // Allow external connections

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