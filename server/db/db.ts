import { Sequelize } from 'sequelize-typescript'; 
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Import models
import { User } from '../models/User';
import { Tag } from '../models/Tag';
import { Todo } from '../models/Todo';


const db = new Sequelize({
  database: process.env.DB_NAME || 'streamscene_db',
  username: process.env.DB_USER || '',
  password: process.env.DB_PASS || '',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mysql',
  logging: false, 

  // Automatically associate the models
  models: [User, Tag, Todo],  // Add all models here
});

// Test the database connection and sync process
const testConnection = async () => {
  try {
    await db.authenticate();
    console.log('DB connected successfully!');

    await db.sync({ force: false }); 
    console.log('Database synced successfully!');
  } catch (err) {
    console.error('Error during DB connection or syncing:', err);
    if (err instanceof Error) {
      console.error('Error details:', err.message);
    }
  }
};

testConnection();

export default db;
