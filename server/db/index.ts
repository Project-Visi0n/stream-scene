// server/db/index.ts
// Database models and sync functions

import { getSequelize, testConnection } from './connection.js';

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
import BudgetEntry from '../models/BudgetEntry.js';
import BudgetProject from '../models/BudgetProject.js';

// Initialize models
const File = initFileModel(sequelizeInstance);
initSocialAccountTokenModel(sequelizeInstance);
initScheduledPostModel(sequelizeInstance);

// Task model should already be initialized in its own file
// Just make sure it's using the same sequelize instance

export const associate = () => {
  console.log('✅ Setting up database associations...');
  
  // Budget model associations
  BudgetEntry.belongsTo(BudgetProject, {
    foreignKey: 'project_id',
    as: 'project',
  });

  BudgetProject.hasMany(BudgetEntry, {
    foreignKey: 'project_id',
    as: 'entries',
  });
  
  console.log('✅ Database associations ready');
};

// Sync EVERYTHING including new models
export async function syncDB() {
  try {
    associate();
    
    // Check if Canvas tables need migration from INTEGER to STRING ids
    try {
      const canvasTableDescription = await getSequelize().getQueryInterface().describeTable('canvases');
      const canvasCollaboratorTableDescription = await getSequelize().getQueryInterface().describeTable('canvas_collaborators');
      
      const canvasIdColumn = canvasTableDescription.id;
      const canvasCollaboratorCanvasIdColumn = canvasCollaboratorTableDescription.canvasId;
      
      if (canvasIdColumn && (
        canvasIdColumn.type.includes('INTEGER') || 
        canvasIdColumn.type.includes('int')
      )) {
        console.log('� Canvas tables have INTEGER ids, migrating to STRING...');
        
        // Drop Canvas and CanvasCollaborator tables to recreate with correct schema
        await getSequelize().getQueryInterface().dropTable('canvas_collaborators');
        await getSequelize().getQueryInterface().dropTable('canvases');
        console.log('🗑️  Dropped Canvas tables for recreation');
      } else {
        console.log('✅ Canvas tables already have correct STRING schema');
      }
    } catch (error) {
      console.log('📦 Canvas tables do not exist yet, will be created with correct schema');
    }
    
    // Force recreation of Canvas tables with correct schema
    // await Canvas.sync({ force: true });
    // await CanvasCollaborator.sync({ force: true });
    // console.log('✅ Canvas tables recreated with correct schema');
    
    // Just ensure tables exist without forcing recreation
    await Canvas.sync({ force: false });
    await CanvasCollaborator.sync({ force: false });
    console.log('✅ Canvas tables synced (no force recreation)');
    
    // Use sync with alter to handle foreign key mismatches gracefully
    await getSequelize().sync({ 
      force: false,
      alter: false  // Disabled alter to avoid schema conflicts
    });
    console.log('Database sync complete (File, SocialAccountToken, ScheduledPost, Task, Comment, CommentReaction, Canvas, CanvasCollaborator, BudgetProject, BudgetEntry)');
  } catch (error) {
    console.error('Database sync failed:', error);
    // Continue without throwing to allow server to start
    console.log('🔧 Continuing with existing database schema...');
  }
}

export {
  User,
  File,
  Share,
  SocialAccountToken,
  ScheduledPost,
  Task,
  Comment,
  CommentReaction,
  Canvas,
  CanvasCollaborator,
  BudgetProject,
  BudgetEntry
};

export const db = {
  sequelize: sequelizeInstance,
  File,
  Share,
  SocialAccountToken,
  ScheduledPost,
  User,
  Task,
  BudgetProject,
  BudgetEntry,
  associate,
};

export type DB = typeof db;
export default db;