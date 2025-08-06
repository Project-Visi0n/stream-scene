import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import path from 'path';
import "./config/passport";
import authRoutes from "./routes/auth";
import routes from "./routes/index";
import aiRoutes from "./routes/ai";
import scheduleRoutes from "./routes/schedule";
import s3ProxyRoutes from "./routes/s3Proxy";
import { syncDB } from "./db/index";

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:8000', // Allow requests from frontend
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
app.use(express.static(path.join(__dirname, '../public')));

// Auth routes 
app.use('/auth', authRoutes);
app.use('/', routes);
app.use('/api/ai', aiRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/s3', s3ProxyRoutes);

// API test route
app.get('/test-server', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Catch-all handler for SPA routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
    return res.status(404).json({ error: 'Route not found' });
  }

  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 8000;

// Initialize database
syncDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:8000`);
  });
}).catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

export default app;