import { Model } from 'sequelize-typescript';
export declare class Todo extends Model<Todo> {
    id: number;
    user_id: number;
    title: string;
    created_at: Date;
    completed_at?: Date;
    deadline?: Date;
    start_by?: Date;
    description?: string;
}
//# sourceMappingURL=Todo.d.ts.map