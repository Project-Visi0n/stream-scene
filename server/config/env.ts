import dotenv from "dotenv";
import path from "path";

// Load .env from root directory (when compiled, this will be dist/server/src/config/)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const ENV = {
  PORT: process.env.PORT || "8000",
  NODE_ENV: process.env.NODE_ENV || "development",
};
