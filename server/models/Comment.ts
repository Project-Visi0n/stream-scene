// server/src/models/Comment.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';

import { User } from './User';
import { Media } from './Media';

@Table({ tableName: 'comments', timestamps: false })
export class Comment extends Model {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  user_id!: number;

  @ForeignKey(() => Media)
  @Column(DataType.BIGINT)
  media_id!: number;

  @ForeignKey(() => Comment)
  @Column(DataType.BIGINT)
  parent_id!: number;

  @Column(DataType.TEXT)
  comment_body!: string;

  @Column(DataType.DATE)
  created_at!: Date;

  // ----- Associations -----

  @BelongsTo(() => User)
  user!: User;

  @BelongsTo(() => Media)
  media!: Media;

  @BelongsTo(() => Comment, { as: 'Parent' })
  parent!: Comment;

  @HasMany(() => Comment, { foreignKey: 'parent_id', as: 'Replies' })
  replies!: Comment[];
}
