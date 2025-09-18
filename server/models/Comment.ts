import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../db/connection.js';

interface CommentAttributes {
  id: number;
  fileId: number;
  userId?: number | null; // Nullable for anonymous users
  guestName?: string | null; // For anonymous commenters
  guestIdentifier?: string | null; // Session/browser ID for anonymous users
  content: string;
  timestampSeconds?: number | null; // For video/audio comments
  parentCommentId?: number | null; // For threaded replies
  isDeleted: boolean; // Soft delete for moderation
  isModerationHidden: boolean; // Hidden by file owner
  isEdited: boolean; // Track if comment has been edited
  isModerated: boolean; // Track if comment has been moderated
  moderatedReason?: string | null; // Reason for moderation
  createdAt: Date;
  updatedAt: Date;
}

interface CommentCreationAttributes extends Optional<CommentAttributes, 'id' | 'userId' | 'guestName' | 'guestIdentifier' | 'timestampSeconds' | 'parentCommentId' | 'isDeleted' | 'isModerationHidden' | 'isEdited' | 'isModerated' | 'moderatedReason' | 'createdAt' | 'updatedAt'> {}

class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
  public id!: number;
  public fileId!: number;
  public userId!: number | null;
  public guestName!: string | null;
  public guestIdentifier!: string | null;
  public content!: string;
  public timestampSeconds!: number | null;
  public parentCommentId!: number | null;
  public isDeleted!: boolean;
  public isModerationHidden!: boolean;
  public isEdited!: boolean;
  public isModerated!: boolean;
  public moderatedReason!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association helpers
  public readonly replies?: Comment[];
  public readonly parentComment?: Comment;
  public readonly user?: any;
  public readonly file?: any;
}

Comment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fileId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'files',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: true, // Nullable for anonymous users
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL', // Keep comment if user is deleted
    },
    guestName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [1, 100],
      },
    },
    guestIdentifier: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Session/browser identifier for anonymous users',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 2000], // Max 2000 characters
      },
    },
    timestampSeconds: {
      type: DataTypes.DECIMAL(10, 3), // Supports millisecond precision
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    parentCommentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'comments',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isModerationHidden: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Hidden by file owner moderation',
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Track if comment has been edited',
    },
    isModerated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Track if comment has been moderated',
    },
    moderatedReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Reason for moderation action',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: getSequelize(),
    modelName: 'Comment',
    tableName: 'comments',
    timestamps: true,
    indexes: [
      { fields: ['fileId'] },
      { fields: ['userId'] },
      { fields: ['guestIdentifier'] },
      { fields: ['parentCommentId'] },
      { fields: ['timestampSeconds'] },
      { fields: ['createdAt'] },
      { fields: ['isDeleted', 'isModerationHidden'] }, // For filtering visible comments
    ],
  }
);

export default Comment;