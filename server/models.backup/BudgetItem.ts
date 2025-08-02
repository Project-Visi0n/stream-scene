// server/src/models/BudgetItem.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { Project } from './Project';

@Table({ tableName: 'Budget Item', timestamps: false }) 
export class BudgetItem extends Model {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => Project)
  @Column(DataType.BIGINT)
  project_id!: number;

  @Column(DataType.DATE)
  created_at!: Date;

  @Column(DataType.TEXT)
  dollar_limit!: string;

  @Column(DataType.TEXT)
  dollar_current!: string;

  @Column(DataType.TEXT)
  description!: string;

  @BelongsTo(() => Project)
  project!: Project;
}
