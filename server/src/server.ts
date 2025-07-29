import dotenv from 'dotenv';
import path from 'path';
import app from './app'; 
import db from './db'; 
const sequelize = db.sequelize; 

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 8000;

// Boot up the DB, sync the models, and start the server
const startServer = async () => {
  try {
    // Test DB connection
    console.log('Starting DB connection...');
    await sequelize.authenticate();
    console.log('Connected to DB successfully!');


   


    // Start the server
    console.log('Starting the server...');
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Error during server startup:', err);
    if (err instanceof Error) {
      console.error('Error details:', err.message);
    }
  }
};

startServer();
