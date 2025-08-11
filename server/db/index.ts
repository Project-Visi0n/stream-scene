// Always load environment variables first
import dotenv from 'dotenv';
dotenv.config();

// Import Sequelize 
import { Sequelize } from 'sequelize';
// Do not import models yet

// Set up Sequelize connection (but don't connect yet)
let sequelize: Sequelize | null = null;

const getSequelize = () => {
  if (!sequelize) {
    sequelize = new Sequelize({
      dialect: 'mysql', 
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'streamscene_db',
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
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

// call this to sync the DB (including File model)
export const syncDB = async (force = false) => {
  try {
    await File.sync({ force });
    console.log('Database sync complete (File model)');
  } catch (error) {
    console.error('Database sync failed:', error);
  }
};

// After Sequelize is initialized, import models and register them
const sequelizeInstance = getSequelize();

// Import model initializer
import { initFileModel } from '../models/initFileModel.js';
import { Share } from '../models/Share.js';

// Initialize File model after Sequelize is ready
const File = initFileModel(sequelizeInstance);

export const db = {
  sequelize: sequelizeInstance,
  File,
  Share,
  associate,
};

export type DB = typeof db;
export default db;

// Don't test connection on startup - let it be tested when needed
// testConnection();