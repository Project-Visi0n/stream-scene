// server/src/models/Todo.ts

import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'todos',
  timestamps: false,
})
export class Todo extends Model<Todo> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  user_id!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at!: Date;

  @Column(DataType.DATEONLY)
  completed_at?: Date;

  @Column(DataType.DATEONLY)
  deadline?: Date;

  @Column(DataType.DATEONLY)
  start_by?: Date;

  @Column(DataType.TEXT)
  description?: string;
}
