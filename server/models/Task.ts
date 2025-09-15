import { DataTypes, Model, Optional, Op } from 'sequelize';
import { getSequelize } from '../db/connection.js';

// Define the Task attributes interface
export interface TaskAttributes {
  id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  task_type: 'creative' | 'admin';
  status: 'pending' | 'in_progress' | 'completed';
  deadline?: Date;  // Made optional to match API usage
  estimated_hours?: number;
  user_id: number;
  created_at?: Date;
  updated_at?: Date;
}

// Define the Task creation attributes (optional id and timestamps)
export interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'created_at' | 'updated_at' | 'deadline'> {}

// Define the Task model class
export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  declare id: number;
  declare title: string;
  declare description?: string;
  declare priority: 'low' | 'medium' | 'high';
  declare task_type: 'creative' | 'admin';
  declare status: 'pending' | 'in_progress' | 'completed';
  declare deadline?: Date;
  declare estimated_hours?: number;
  declare user_id: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // Static methods for common queries
  static async findByUserId(userId: number): Promise<Task[]> {
    return await Task.findAll({
      where: { user_id: userId },
      order: [['deadline', 'ASC'], ['priority', 'DESC']]
    });
  }

  static async findByUserIdAndId(id: number, userId: number): Promise<Task | null> {
    return await Task.findOne({
      where: { id, user_id: userId }
    });
  }

  static async getTasksByStatus(userId: number, status: TaskAttributes['status']): Promise<Task[]> {
    return await Task.findAll({
      where: { user_id: userId, status },
      order: [['deadline', 'ASC'], ['priority', 'DESC']]
    });
  }

  static async getTasksByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Task[]> {
    return await Task.findAll({
      where: {
        user_id: userId,
        deadline: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['deadline', 'ASC']]
    });
  }
}

// Initialize the model
Task.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: false,
    defaultValue: 'medium',
  },
  task_type: {
    type: DataTypes.ENUM('creative', 'admin'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
    allowNull: false,
    defaultValue: 'pending',
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: true,  // Changed from false to true
  },
  estimated_hours: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at',
  },
}, {
  sequelize: getSequelize(),
  modelName: 'Task',
  tableName: 'tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['deadline'] },
    { fields: ['status'] },
    { fields: ['priority'] },
  ],
});

export default Task;