// Todos.ts
import {
  Model,
  DataTypes,
  Optional,
} from 'sequelize';
import sequelize from '../db/db';
import User from './User';

export interface TodoAttributes {
  id: number;
  user_id?: number | null;
  title?: string | null;
  created_at?: Date | null;
  completed_at?: Date | null;
  deadline?: Date | null;
  start_by?: Date | null;
  description?: string | null;
}

export interface TodoCreationAttributes extends Optional<TodoAttributes, 'id'> {}

class Todo
  extends Model<TodoAttributes, TodoCreationAttributes>
  implements TodoAttributes
{
  public id!: number;
  public user_id!: number | null;
  public title!: string | null;
  public created_at!: Date | null;
  public completed_at!: Date | null;
  public deadline!: Date | null;
  public start_by!: Date | null;
  public description!: string | null;
}

Todo.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    deadline: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    start_by: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Todo',
    tableName: 'todos',
    timestamps: false,
  }
);

Todo.belongsTo(User, { foreignKey: 'user_id' });

export default Todo;
