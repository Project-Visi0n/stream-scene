import { DataTypes, Model, Optional, Op } from 'sequelize';
import { getSequelize } from '../db/connection.js';

interface CommentReactionAttributes {
  id: number;
  commentId: number;
  userId?: number | null; // Nullable for anonymous users
  guestName?: string | null; // For anonymous reactions
  guestIdentifier?: string | null; // For anonymous reactions
  reactionType: 'like' | 'dislike' | 'heart' | 'laugh' | 'sad' | 'angry';
  emoji?: string | null; // Support custom emojis
  createdAt: Date;
  updatedAt: Date;
}

interface CommentReactionCreationAttributes extends Optional<CommentReactionAttributes, 'id' | 'userId' | 'guestName' | 'guestIdentifier' | 'emoji' | 'createdAt' | 'updatedAt'> {}

class CommentReaction extends Model<CommentReactionAttributes, CommentReactionCreationAttributes> implements CommentReactionAttributes {
  public id!: number;
  public commentId!: number;
  public userId!: number | null;
  public guestName!: string | null;
  public guestIdentifier!: string | null;
  public reactionType!: 'like' | 'dislike' | 'heart' | 'laugh' | 'sad' | 'angry';
  public emoji!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association helpers
  public readonly comment?: any;
  public readonly user?: any;
}

CommentReaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    commentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'comments',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: true, // Allow null for anonymous users
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    guestIdentifier: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Session/browser identifier for anonymous reactions',
    },
    guestName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [1, 100],
      },
    },
    reactionType: {
      type: DataTypes.ENUM('like', 'dislike', 'heart', 'laugh', 'sad', 'angry'),
      allowNull: false,
    },
    emoji: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Custom emoji for reaction',
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
    modelName: 'CommentReaction',
    tableName: 'comment_reactions',
    timestamps: true,
    indexes: [
      { fields: ['commentId'] },
      { fields: ['userId'] },
      { fields: ['guestIdentifier'] },
      { fields: ['reactionType'] },
      // Unique constraint: one reaction per user/guest per comment
      { 
        fields: ['commentId', 'userId'], 
        unique: true,
        where: { userId: { [Op.ne]: null } }
      },
      { 
        fields: ['commentId', 'guestIdentifier'], 
        unique: true,
        where: { guestIdentifier: { [Op.ne]: null } }
      },
    ],
  }
);

export default CommentReaction;