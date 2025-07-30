// server/src/models/Project.ts
import {
  Table,
  Column,
  Model,
  DataType,
  BelongsToMany,
  HasMany,
} from 'sequelize-typescript';

import { User } from './User';
import { BudgetItem } from './BudgetItem';
import { ProjectUser } from './ProjectUser';

@Table({ tableName: 'Project', timestamps: false })
export class Project extends Model {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column(DataType.BIGINT)
  googlesheets_id!: number;

  @Column(DataType.BIGINT)
  created_at!: number;

  @BelongsToMany(() => User, () => ProjectUser)
  users!: User[];

  @HasMany(() => BudgetItem)
  budgetItems!: BudgetItem[];
}
