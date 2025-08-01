// server/src/models/Note.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { User } from './User';

@Table({ tableName: 'Notes', timestamps: false })
export class Note extends Model {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  user_id!: number;

  @Column(DataType.DATEONLY)
  created_at!: Date;

  @Column(DataType.DATE)
  updated_at!: Date;

  @Column(DataType.TEXT)
  tags!: string;

  @BelongsTo(() => User)
  user!: User;
}
