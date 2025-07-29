// server/src/models/MediaTag.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';

import { Media } from './Media';
import { Tag } from './Tag';

@Table({ tableName: 'Media_tags', timestamps: false })
export class MediaTag extends Model {
  @ForeignKey(() => Media)
  @Column({ type: DataType.BIGINT, primaryKey: true })
  media_id!: number;

  @ForeignKey(() => Tag)
  @Column({ type: DataType.BIGINT, primaryKey: true })
  tag_id!: number;
}
