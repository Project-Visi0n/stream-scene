// server/src/models/TodoTag.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';

import { Todo } from './Todo';
import { Tag } from './Tag';

@Table({ tableName: 'Todo_tags', timestamps: false })
export class TodoTag extends Model {
  @ForeignKey(() => Todo)
  @Column({ type: DataType.BIGINT, primaryKey: true })
  todo_id!: number;

  @ForeignKey(() => Tag)
  @Column({ type: DataType.BIGINT, primaryKey: true })
  tag_id!: number;
}
