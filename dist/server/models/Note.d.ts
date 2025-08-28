import { Model } from 'sequelize-typescript';
import { User } from '../models/User';
export declare class Note extends Model {
    id: number;
    user_id: number;
    created_at: Date;
    updated_at: Date;
    tags: string;
    user: User;
}
//# sourceMappingURL=Note.d.ts.map