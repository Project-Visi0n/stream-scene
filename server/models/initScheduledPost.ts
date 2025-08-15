import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { SocialAccountToken } from './initSocialAccountToken.js';

export type PostStatus = 'pending' | 'queued' | 'published' | 'failed';

export interface ScheduledPostAttributes {
  id: number;
  socialAccountTokenId: number;
  text: string;
  media?: { imageUrls?: string[]; videoUrl?: string | null } | null;
  scheduledFor: Date;
  status: PostStatus;
  errorMessage?: string | null;
  publishedPostId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type CreationAttrs = Optional<ScheduledPostAttributes, 'id' | 'media' | 'status' | 'errorMessage' | 'publishedPostId' | 'createdAt' | 'updatedAt'>;

export class ScheduledPost extends Model<ScheduledPostAttributes, CreationAttrs>
  implements ScheduledPostAttributes {
  public id!: number;
  public socialAccountTokenId!: number;
  public text!: string;
  public media!: { imageUrls?: string[]; videoUrl?: string | null } | null;
  public scheduledFor!: Date;
  public status!: PostStatus;
  public errorMessage!: string | null;
  public publishedPostId!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initScheduledPostModel(sequelize: Sequelize) {
  ScheduledPost.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      socialAccountTokenId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      text: { type: DataTypes.TEXT, allowNull: false },
      media: { type: DataTypes.JSON, allowNull: true },
      scheduledFor: { type: DataTypes.DATE, allowNull: false },
      status: { type: DataTypes.ENUM('pending','queued','published','failed'), allowNull: false, defaultValue: 'pending' },
      errorMessage: { type: DataTypes.TEXT, allowNull: true },
      publishedPostId: { type: DataTypes.STRING, allowNull: true },
    },
    { sequelize, tableName: 'ScheduledPosts' }
  );

  // association
  ScheduledPost.belongsTo(SocialAccountToken, { foreignKey: 'socialAccountTokenId', as: 'account' });

  return ScheduledPost;
}
