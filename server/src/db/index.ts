import sequelize from './db';

// ----- Import Models -----
import User from '../models/User';
import Todo from '../models/Todos';
import Tag from '../models/Tag';
import TodoTag from '../models/TodoTag';
import Note from '../models/Note';
import FileSegment from '../models/FileSegment';
import Media from '../models/Media';
import MediaTag from '../models/MediaTag';
import Comment from '../models/Comment';
import Project from '../models/Project';
import ProjectUser from '../models/ProjectUser';
import BudgetItem from '../models/BudgetItem';

// ----- Associations -----
export const associate = () => {
  // User
  User.hasMany(Todo, { foreignKey: 'user_id' });
  User.hasMany(Tag, { foreignKey: 'user_id' });
  User.hasMany(Note, { foreignKey: 'user_id' });
  User.hasMany(Media, { foreignKey: 'user_id' });
  User.hasMany(Comment, { foreignKey: 'user_id' });
  User.belongsToMany(Project, { through: ProjectUser, foreignKey: 'user_id' });

  // Todo
  Todo.belongsTo(User, { foreignKey: 'user_id' });
  Todo.belongsToMany(Tag, { through: TodoTag, foreignKey: 'todo_id' });

  // Tag
  Tag.belongsTo(User, { foreignKey: 'user_id' });
  Tag.belongsToMany(Todo, { through: TodoTag, foreignKey: 'tag_id' });
  Tag.belongsToMany(Media, { through: MediaTag, foreignKey: 'tag_id' });

  // Note
  Note.belongsTo(User, { foreignKey: 'user_id' });
  Note.hasMany(FileSegment, { foreignKey: 'note_id' });

  // FileSegment
  FileSegment.belongsTo(Note, { foreignKey: 'note_id' });

  // Media
  Media.belongsTo(User, { foreignKey: 'user_id' });
  Media.belongsToMany(Tag, { through: MediaTag, foreignKey: 'media_id' });
  Media.hasMany(Comment, { foreignKey: 'media_id' });

  // Comment
  Comment.belongsTo(User, { foreignKey: 'user_id' });
  Comment.belongsTo(Media, { foreignKey: 'media_id' });
  Comment.belongsTo(Comment, { foreignKey: 'parent_id', as: 'Parent' });
  Comment.hasMany(Comment, { foreignKey: 'parent_id', as: 'Replies' });

  // Project
  Project.belongsToMany(User, { through: ProjectUser, foreignKey: 'project_id' });
  Project.hasMany(BudgetItem, { foreignKey: 'project_id' });

  // ProjectUser
  ProjectUser.belongsTo(User, { foreignKey: 'user_id' });
  ProjectUser.belongsTo(Project, { foreignKey: 'project_id' });

  // BudgetItem
  BudgetItem.belongsTo(Project, { foreignKey: 'project_id' });
};

// Optional sync helper
export const syncDB = async (force = false) => {
  await sequelize.sync({ force });
};

// Export everything
export {
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
};

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
  associate, // <== export associate here
};

export type DB = typeof db;
export default db;
