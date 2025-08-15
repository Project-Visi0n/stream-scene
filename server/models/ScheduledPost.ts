import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, AllowNull, Default, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { SocialAccountToken } from './SocialAccountToken.js';

export type PostStatus = 'pending' | 'queued' | 'published' | 'failed';

@Table({ tableName: 'ScheduledPosts', timestamps: true })
export class ScheduledPost extends Model {
  @PrimaryKey @AutoIncrement @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false) @ForeignKey(() => SocialAccountToken) @Column(DataType.INTEGER)
  socialAccountTokenId!: number;

  @BelongsTo(() => SocialAccountToken)
  account!: SocialAccountToken;

  @AllowNull(false) @Column(DataType.TEXT)
  text!: string;

  @AllowNull(true) @Column(DataType.JSON)
  media?: { imageUrls?: string[]; videoUrl?: string | null } | null;

  @AllowNull(false) @Column(DataType.DATE)
  scheduledFor!: Date;

  @AllowNull(false) @Default('pending') @Column(DataType.STRING)
  status!: PostStatus;

  @AllowNull(true) @Column(DataType.TEXT)
  errorMessage?: string | null;

  @AllowNull(true) @Column(DataType.STRING)
  publishedPostId?: string | null;
}
