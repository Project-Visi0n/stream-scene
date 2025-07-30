// server/src/models/ProjectUser.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';

import { User } from './User';
import { Project } from './Project';

@Table({ tableName: 'Project_users', timestamps: false })
export class ProjectUser extends Model {
  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT, primaryKey: true })
  user_id!: number;

  @ForeignKey(() => Project)
  @Column({ type: DataType.BIGINT, primaryKey: true })
  project_id!: number;
}
