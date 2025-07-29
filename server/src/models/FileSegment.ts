// server/src/models/FileSegment.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { Note } from './Note';

@Table({ tableName: '`File Segment`', timestamps: false }) // 👈 if you must keep this name
export class FileSegment extends Model {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => Note)
  @Column(DataType.BIGINT)
  note_id!: number;

  @Column(DataType.TEXT)
  path!: string;

  @BelongsTo(() => Note)
  note!: Note;
}
