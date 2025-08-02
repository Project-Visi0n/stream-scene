// Always load environment variables first
import dotenv from 'dotenv';
dotenv.config();

// Import Sequelize and your models
import { Sequelize } from 'sequelize-typescript';
// import { User } from '../models/User'; // Temporarily disabled - using mock User

// Set up Sequelize connection (disabled for testing)
const sequelize = new Sequelize({
  dialect: 'mysql', 
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  models: [], // No models for now
  logging: false,
});

// Simplified associations (disabled for testing)
export const associate = () => {
  console.log('Database associations disabled for testing');
};

// call this to sync the DB (disabled for testing)
export const syncDB = async (force = false) => {
  console.log('Database sync disabled for testing');
  // await sequelize.sync({ force });
};

// Export everything in one object (minimal for testing)
export const db = {
  sequelize,
  associate,
};

export type DB = typeof db;
export default db;