import {
  Model,
  DataTypes,
  Optional,
} from 'sequelize';
import sequelize from '../db/db';
import User from './User';
import Media from './Media';

export interface CommentAttributes {
  id: number;
  user_id?: number | null;
  media_id?: number | null;
  parent_id?: number | null;
  comment_body?: string | null;
  created_at?: Date | null;
}

export interface CommentCreationAttributes
  extends Optional<CommentAttributes, 'id'> {}

class Comment
  extends Model<CommentAttributes, CommentCreationAttributes>
  implements CommentAttributes
{
  public id!: number;
  public user_id!: number | null;
  public media_id!: number | null;
  public parent_id!: number | null;
  public comment_body!: string | null;
  public created_at!: Date | null;
}

Comment.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    media_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    parent_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    comment_body: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Comment',
    tableName: 'comments',
    timestamps: false,
  }
);

// ----- Associations -----
Comment.belongsTo(User, { foreignKey: 'user_id' });
Comment.belongsTo(Media, { foreignKey: 'media_id' });
// Self-referencing reply threads
Comment.belongsTo(Comment, { foreignKey: 'parent_id', as: 'Parent' });
Comment.hasMany(Comment, { foreignKey: 'parent_id', as: 'Replies' });

export default Comment;
