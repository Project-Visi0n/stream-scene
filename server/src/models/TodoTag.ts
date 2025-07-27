// TodoTag.ts
import {
  Model,
  DataTypes,
} from 'sequelize';
import sequelize from '../db/db';

export interface TodoTagAttributes {
  todo_id: number;
  tag_id: number;
}

class TodoTag extends Model<TodoTagAttributes> implements TodoTagAttributes {
  public todo_id!: number;
  public tag_id!: number;
}

TodoTag.init(
  {
    todo_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      references: {
        model: 'todos',
        key: 'id',
      },
    },
    tag_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      references: {
        model: 'tags',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'TodoTag',
    tableName: 'Todo_tags',
    timestamps: false,
  }
);

export default TodoTag;
