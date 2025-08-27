import { Model, Optional } from 'sequelize';
export interface TaskAttributes {
    id: number;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    task_type: 'creative' | 'admin';
    status: 'pending' | 'in_progress' | 'completed';
    deadline: Date;
    estimated_hours?: number;
    user_id: number;
    created_at?: Date;
    updated_at?: Date;
}
export interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'created_at' | 'updated_at'> {
}
export declare class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
    id: number;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    task_type: 'creative' | 'admin';
    status: 'pending' | 'in_progress' | 'completed';
    deadline: Date;
    estimated_hours?: number;
    user_id: number;
    readonly created_at: Date;
    readonly updated_at: Date;
    static findByUserId(userId: number): Promise<Task[]>;
    static findByUserIdAndId(id: number, userId: number): Promise<Task | null>;
    static getTasksByStatus(userId: number, status: TaskAttributes['status']): Promise<Task[]>;
    static getTasksByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Task[]>;
}
export default Task;
//# sourceMappingURL=Task.d.ts.map