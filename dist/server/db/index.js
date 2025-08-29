// server/db/index.ts
// Database models and sync functions
import { getSequelize } from './connection.js';
// Get the sequelize instance
const sequelizeInstance = getSequelize();
// import model initializers **after** sequelizeInstance exists
import { initFileModel } from '../models/initFileModel.js';
import { Share } from '../models/Share.js';
import { initSocialAccountTokenModel, SocialAccountToken } from '../models/initSocialAccountToken.js';
import { initScheduledPostModel, ScheduledPost } from '../models/initScheduledPost.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
// Initialize models
const File = initFileModel(sequelizeInstance);
initSocialAccountTokenModel(sequelizeInstance);
initScheduledPostModel(sequelizeInstance);
// Task model should already be initialized in its own file
// Just make sure it's using the same sequelize instance
export const associate = () => {
    console.log('Database associations set up');
};
// Sync EVERYTHING including Task
export const syncDB = async (force = false) => {
    try {
        await sequelizeInstance.sync({ force });
        console.log('Database sync complete (File, SocialAccountToken, ScheduledPost, Task)');
    }
    catch (error) {
        console.error('Database sync failed:', error);
        throw error;
    }
};
export { User, File, Share, SocialAccountToken, ScheduledPost, Task };
export const db = {
    sequelize: sequelizeInstance,
    File,
    Share,
    SocialAccountToken,
    ScheduledPost,
    User,
    Task,
    associate,
};
export default db;
