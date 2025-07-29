import dotenv from 'dotenv';
import path from 'path';
import app from './app'; 
import { sequelize } from './db';

// 🌱 Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 3001;

// 🚀 Boot up the DB and start the server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log(' Connected to DB');

    app.listen(PORT, () => {
      console.log(` Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error(' Failed to connect to DB:', err);
  }
};

startServer();
