import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
// import db from './db';


import authRoutes from './routes/auth';
import indexRoutes from './routes/index';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Parse JSON bodies
app.use(express.json());

// API Routes
app.use('/auth', authRoutes);
app.use('/api', indexRoutes);

// Mini test route
app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

// Serve frontend static files from client/dist
app.use(express.static(path.resolve(__dirname, '../../client/dist')));

// React Router support (fallback route)
app.get('*', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '../../client/index.html'));
});

// Start server after DB connection is successful
// // const startServer = async () => {
//   try {
//     await db.sequelize.authenticate();
//     console.log(' Connected to the database');

//     app.listen(PORT, () => {
//       console.log(`Server is running at http://localhost:${PORT}`);
//     });
//   } catch (error) {
//     console.error(' Failed to start server:', error);
//   }
// };

// startServer();

// Simple start without DB
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});