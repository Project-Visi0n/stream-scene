import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
} from 'sequelize-typescript';

// Import the associated models
import { User } from './User'; // Import User model
import { TodoTag } from './TodoTag';
import { MediaTag } from './MediaTag';
import { Todo } from './Todo'; // Import Todo model
import { Media } from './Media'; // Import Media model

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

  // Define the foreign key column
  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  user_id!: number;

  // BelongsTo association (this is for accessing the related User)
  @BelongsTo(() => User)
  user!: User; // Type the `user` field properly with `User` model

  // Many-to-many relationship with Todo via TodoTag
  @BelongsToMany(() => Todo, () => TodoTag)
  todos!: Todo[];

  // Many-to-many relationship with Media via MediaTag
  @BelongsToMany(() => Media, () => MediaTag)
  media!: Media[];
}
