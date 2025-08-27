// server/db/index.ts
// Always load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';


let sequelize: Sequelize | null = null;
export const getSequelize = () => {
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

// Create instance early
const sequelizeInstance = getSequelize();

// import model initializers **after** sequelizeInstance exists
import { initFileModel } from '../models/initFileModel.js';
import { Share } from '../models/Share.js';
import { initSocialAccountTokenModel, SocialAccountToken } from '../models/initSocialAccountToken.js';
import { initScheduledPostModel, ScheduledPost } from '../models/initScheduledPost.js';
import User from '../models/User.js';

// Initialize models
const File = initFileModel(sequelizeInstance);
initSocialAccountTokenModel(sequelizeInstance);
initScheduledPostModel(sequelizeInstance);

// (Associations are set inside initScheduledPostModel via belongsTo)
export const associate = () => {
  console.log('Database associations set up');
};

export const testConnection = async () => {
  try {
    await sequelizeInstance.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    console.log('Continuing with in-memory storage fallback...');
  }
};

// Sync EVERYTHING (not just File)
export const syncDB = async (force = false) => {
  try {
    await sequelizeInstance.sync({ force });
    console.log('Database sync complete (File, SocialAccountToken, ScheduledPost)');
  } catch (error) {
    console.error('Database sync failed:', error);
    throw error;
  }
};

export const db = {
  sequelize: sequelizeInstance,
  File,
  Share,
  SocialAccountToken,
  ScheduledPost,
  User,
  associate,
};

export type DB = typeof db;
export default db;
