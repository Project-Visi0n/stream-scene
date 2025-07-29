// server/src/models/Tag.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
} from 'sequelize-typescript';

import { User } from './User';
import { Todo } from './Todos';
import { TodoTag } from './TodoTag';
import { Media } from './Media';
import { MediaTag } from './MediaTag';

@Table({ tableName: 'tags', timestamps: false })
export class Tag extends Model {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column(DataType.STRING)
  tag_name!: string;

  @Column(DataType.STRING)
  description!: string;

  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  user_id!: number;

  @BelongsTo(() => User)
  user!: User;

  @BelongsToMany(() => Todo, () => TodoTag)
  todos!: Todo[];

  @BelongsToMany(() => Media, () => MediaTag)
  media!: Media[];
}
