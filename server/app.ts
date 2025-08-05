import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import "./config/passport";
import authRoutes from "./routes/auth";
import routes from "./routes/index";
import aiRoutes from "./routes/ai";
import scheduleRoutes from "./routes/schedule";
import taskRoutes from "./routes/tasks"; 
import db from './db/index'; 
import User from './models/User'; 
import Task from './models/Task'; 

const app = express();

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
app.use('/api/tasks', taskRoutes); 

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

// Initialize database and start server
async function startServer() {
  try {
    // Connect to database
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models (create tables if they don't exist)
    await User.sync();
    await Task.sync();
    
    // Set up model associations
    User.hasMany(Task, { foreignKey: 'user_id' });
    Task.belongsTo(User, { foreignKey: 'user_id' });
    
    console.log('Models synced successfully.');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;