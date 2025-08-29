import dotenv from "dotenv";
import path from "path";

// Determine which env file to load based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
const envPath = path.resolve(process.cwd(), envFile);

console.log(`Loading environment from: ${envPath}`);
dotenv.config({ path: envPath });

// Fallback to main .env if specific env file doesn't exist
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const ENV = {
  PORT: process.env.PORT || "8000",
  NODE_ENV: process.env.NODE_ENV || "development",
};
