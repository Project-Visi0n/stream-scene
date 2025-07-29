// server/src/models/Todos.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './User'; // ✅ fixed import

@Table({ tableName: 'todos', timestamps: false })
export class Todo extends Model {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  user_id!: number;

  @Column(DataType.TEXT)
  title!: string;

  @Column(DataType.DATEONLY)
  created_at!: Date;

  @Column(DataType.DATEONLY)
  completed_at!: Date;

  @Column(DataType.DATEONLY)
  deadline!: Date;

  @Column(DataType.DATEONLY)
  start_by!: Date;

  @Column(DataType.TEXT)
  description!: string;

  @BelongsTo(() => User)
  user!: User;
}
