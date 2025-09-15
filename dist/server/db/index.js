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
import Comment from '../models/Comment.js';
import CommentReaction from '../models/CommentReaction.js';
import Canvas from '../models/Canvas.js';
import CanvasCollaborator from '../models/CanvasCollaborator.js';
// Initialize models
const File = initFileModel(sequelizeInstance);
initSocialAccountTokenModel(sequelizeInstance);
initScheduledPostModel(sequelizeInstance);
// Task model should already be initialized in its own file
// Just make sure it's using the same sequelize instance
export const associate = () => {
    // Set up model associations
    // User associations
    User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
    User.hasMany(CommentReaction, { foreignKey: 'userId', as: 'commentReactions' });
    User.hasMany(Canvas, { foreignKey: 'userId', as: 'canvases' });
    User.hasMany(CanvasCollaborator, { foreignKey: 'userId', as: 'canvasCollaborations' });
    // File associations
    File.hasMany(Comment, { foreignKey: 'fileId', as: 'comments' });
    // Comment associations
    Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Comment.belongsTo(File, { foreignKey: 'fileId', as: 'file' });
    Comment.belongsTo(Comment, { foreignKey: 'parentCommentId', as: 'parentComment' });
    Comment.hasMany(Comment, { foreignKey: 'parentCommentId', as: 'replies' });
    Comment.hasMany(CommentReaction, { foreignKey: 'commentId', as: 'reactions' });
    // CommentReaction associations
    CommentReaction.belongsTo(Comment, { foreignKey: 'commentId', as: 'comment' });
    CommentReaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    // Canvas associations
    Canvas.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
    Canvas.hasMany(CanvasCollaborator, { foreignKey: 'canvasId', as: 'collaborators' });
    Canvas.hasMany(Comment, { foreignKey: 'fileId', as: 'comments' }); // Comments on canvas
    // CanvasCollaborator associations
    CanvasCollaborator.belongsTo(Canvas, { foreignKey: 'canvasId', as: 'canvas' });
    CanvasCollaborator.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    console.log('Database associations set up');
};
// Sync EVERYTHING including new models
export const syncDB = async (force = false) => {
    try {
        await sequelizeInstance.sync({ force });
        console.log('Database sync complete (File, SocialAccountToken, ScheduledPost, Task, Comment, CommentReaction, Canvas, CanvasCollaborator)');
    }
    catch (error) {
        console.error('Database sync failed:', error);
        throw error;
    }
};
export { User, File, Share, SocialAccountToken, ScheduledPost, Task, Comment, CommentReaction, Canvas, CanvasCollaborator };
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
