// Always load environment variables first
import dotenv from 'dotenv';
dotenv.config();

// Import Sequelize 
import { Sequelize } from 'sequelize';
import { File } from '../models/File';
import { Share } from '../models/Share';

// Set up Sequelize connection
const sequelize = new Sequelize({
  dialect: 'mysql', 
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'streamscene_db',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  logging: false,
});

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
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

// Test connection on startup
testConnection();

// Export everything in one object
export const db = {
  sequelize,
  File, // This is now our in-memory File class
  Share, // This is now our in-memory Share class
  associate,
};

export type DB = typeof db;
export default db;