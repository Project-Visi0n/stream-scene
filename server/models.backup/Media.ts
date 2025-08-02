// server/src/models/Media.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';

import { User } from './User';
import { Comment } from './Comment';
import { Tag } from './Tag';
import { MediaTag } from './MediaTag';

@Table({ tableName: 'media', timestamps: false })
export class Media extends Model {
  @Column({
    type: DataType.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  user_id!: number;

  @Column(DataType.STRING)
  file_id!: string;

  @Column(DataType.STRING)
  format!: string;

  @Column(DataType.TEXT)
  description!: string;

  @Column(DataType.STRING)
  title!: string;

  @Column(DataType.DATE)
  created_at!: Date;

  @Column(DataType.STRING)
  external_link!: string;

  @BelongsTo(() => User)
  user!: User;

  @HasMany(() => Comment)
  comments!: Comment[];

  @BelongsToMany(() => Tag, () => MediaTag)
  tags!: Tag[];
}
