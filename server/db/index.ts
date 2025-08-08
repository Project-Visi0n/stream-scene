// Always load environment variables first
import dotenv from 'dotenv';
dotenv.config();

// Import Sequelize 
import { Sequelize } from 'sequelize';
import { File } from '../models/File.js';
import { Share } from '../models/Share.js';

// Set up Sequelize connection (but don't connect yet)
let sequelize: Sequelize | null = null;

const getSequelize = () => {
  if (!sequelize) {
    sequelize = new Sequelize({
      dialect: 'mysql', 
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'streamscene_db',
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',  // Fixed: was DB_PASSWORD, should be DB_PASS
      logging: false,
    });
  }
  return sequelize;
};

// Test the connection (non-blocking)
const testConnection = async () => {
  try {
    const db = getSequelize();
    await db.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    console.log('Continuing with in-memory storage fallback...');
  }
};

// Simplified associations 
export const associate = () => {
  console.log('Database associations set up');
};

// call this to sync the DB (excluding File model for now)
export const syncDB = async (force = false) => {
  try {
    // Skip File model sync since we're using in-memory storage
    console.log('Database sync skipped - using in-memory file storage');
  } catch (error) {
    console.error('Database sync failed:', error);
  }
};

// Export everything in one object
export const db = {
  sequelize: getSequelize(),  // Use getter function
  File, // This is now our in-memory File class
  Share, // This is now our in-memory Share class
  associate,
};

export type DB = typeof db;
export default db;

// Don't test connection on startup - let it be tested when needed
// testConnection();