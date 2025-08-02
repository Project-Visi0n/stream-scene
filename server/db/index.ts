// Always load environment variables first
import dotenv from 'dotenv';
dotenv.config();

// Import Sequelize 
import { Sequelize } from 'sequelize';

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

// call this to sync the DB
export const syncDB = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Database sync failed:', error);
  }
};

// Test connection on startup
testConnection();

// Export everything in one object
export const db = {
  sequelize,
  associate,
};

export type DB = typeof db;
export default db;