"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env from root directory
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
// Import models
// import { User } from '../models.backup/User';
const Tag_1 = require("../models/Tag");
const Todo_1 = require("../models/Todo");
const TodoTag_1 = require("../models/TodoTag");
const MediaTag_1 = require("../models/MediaTag");
const Media_1 = require("../models/Media");
const db = new sequelize_typescript_1.Sequelize({
    database: process.env.DB_NAME || 'streamscene_db',
    username: process.env.DB_USER || '',
    password: process.env.DB_PASS || '',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    // Automatically associate the models
    models: [Tag_1.Tag, Todo_1.Todo, TodoTag_1.TodoTag, MediaTag_1.MediaTag, Media_1.Media], // Add all models here
});
// Test the database connection and sync process
const testConnection = async () => {
    try {
        await db.authenticate();
        console.log('DB connected successfully!');
        await db.sync({ force: false });
        console.log('Database synced successfully!');
    }
    catch (err) {
        console.error('Error during DB connection or syncing:', err);
        if (err instanceof Error) {
            console.error('Error details:', err.message);
        }
    }
};
testConnection();
exports.default = db;
//# sourceMappingURL=db.js.map