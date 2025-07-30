import express from "express";
import session from "express-session";
import cors from "cors";
import passport from "./config/passport";
import authRoutes from "./routes/auth";
import routes from "./routes";
import db from "./db";
const sequelize = db.sequelize;

const app = express();

// Enable CORS (if needed for frontend requests to backend)
app.use(cors({
  origin: 'http://localhost:8000', 
  credentials: true // allow cookies/session to be sent
}));

// JSON & form middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (must come before passport)
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Auth routes (Google login)
app.use('/auth', authRoutes);

// Main API routes
app.use('/api', routes);

export default app;
