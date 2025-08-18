import { DataTypes, Model, Op } from 'sequelize';
import db from '../db/index.js';
// Define the Task model class
export class Task extends Model {
    // Static methods for common queries
    static async findByUserId(userId) {
        return await Task.findAll({
            where: { user_id: userId },
            order: [['deadline', 'ASC'], ['priority', 'DESC']]
        });
    }
    static async findByUserIdAndId(id, userId) {
        return await Task.findOne({
            where: { id, user_id: userId }
        });
    }
    static async getTasksByStatus(userId, status) {
        return await Task.findAll({
            where: { user_id: userId, status },
            order: [['deadline', 'ASC'], ['priority', 'DESC']]
        });
    }
    static async getTasksByDateRange(userId, startDate, endDate) {
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
        allowNull: false,
    },
    estimated_hours: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
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
    sequelize: db.sequelize,
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
