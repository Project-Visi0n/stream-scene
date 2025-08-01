// Always load environment variables first
import dotenv from 'dotenv';
dotenv.config();

// Import Sequelize and your models
import { Sequelize } from 'sequelize-typescript';
import { User } from '../models/User';
import { Todo } from '../models/Todo';
import { Tag } from '../models/Tag';
import { TodoTag } from '../models/TodoTag';
import { Note } from '../models/Note';
import { FileSegment } from '../models/FileSegment';
import { Media } from '../models/Media';
import { MediaTag } from '../models/MediaTag';
import { Comment } from '../models/Comment';
import { Project } from '../models/Project';
import { ProjectUser } from '../models/ProjectUser';
import { BudgetItem } from '../models/BudgetItem';

// Set up Sequelize connection
const sequelize = new Sequelize({
  dialect: 'mysql', 
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  models: [User, Todo, Tag, TodoTag, Note, FileSegment, Media, MediaTag, Comment, Project, ProjectUser, BudgetItem],
  logging: false,
});

// Set up all the associations between models
export const associate = () => {
  // User associations
  User.hasMany(Todo, { foreignKey: 'user_id' });
  User.hasMany(Tag, { foreignKey: 'user_id' });
  User.hasMany(Note, { foreignKey: 'user_id' });
  User.hasMany(Media, { foreignKey: 'user_id' });
  User.hasMany(Comment, { foreignKey: 'user_id' });
  User.belongsToMany(Project, { through: ProjectUser, foreignKey: 'user_id' });

  // Todo associations
  Todo.belongsTo(User, { foreignKey: 'user_id' });
  Todo.belongsToMany(Tag, { through: TodoTag, foreignKey: 'todo_id' });

  // Tag associations
  Tag.belongsTo(User, { foreignKey: 'user_id' });
  Tag.belongsToMany(Todo, { through: TodoTag, foreignKey: 'tag_id' });
  Tag.belongsToMany(Media, { through: MediaTag, foreignKey: 'tag_id' });

  // Notes and files
  Note.belongsTo(User, { foreignKey: 'user_id' });
  Note.hasMany(FileSegment, { foreignKey: 'note_id' });
  FileSegment.belongsTo(Note, { foreignKey: 'note_id' });

  // Media and comments
  Media.belongsTo(User, { foreignKey: 'user_id' });
  Media.belongsToMany(Tag, { through: MediaTag, foreignKey: 'media_id' });
  Media.hasMany(Comment, { foreignKey: 'media_id' });

  // Comment threading and ownership
  Comment.belongsTo(User, { foreignKey: 'user_id' });
  Comment.belongsTo(Media, { foreignKey: 'media_id' });
  Comment.belongsTo(Comment, { foreignKey: 'parent_id', as: 'Parent' });
  Comment.hasMany(Comment, { foreignKey: 'parent_id', as: 'Replies' });

  // Projects and users
  Project.belongsToMany(User, { through: ProjectUser, foreignKey: 'project_id' });
  Project.hasMany(BudgetItem, { foreignKey: 'project_id' });

  ProjectUser.belongsTo(User, { foreignKey: 'user_id' });
  ProjectUser.belongsTo(Project, { foreignKey: 'project_id' });

  // Budgets
  BudgetItem.belongsTo(Project, { foreignKey: 'project_id' });
};

// call this to sync the DB
export const syncDB = async (force = false) => {
  await sequelize.sync({ force });
};

// Export everything in one object (easy for importing elsewhere)
export const db = {
  sequelize,
  User,
  Todo,
  Tag,
  TodoTag,
  Note,
  FileSegment,
  Media,
  MediaTag,
  Comment,
  Project,
  ProjectUser,
  BudgetItem,
  associate,
};

export type DB = typeof db;
export default db;
