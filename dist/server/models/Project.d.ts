import { Model } from 'sequelize-typescript';
import { User } from '../models/User';
export declare class Project extends Model {
    id: number;
    googlesheets_id: number;
    created_at: number;
    users: User[];
}
//# sourceMappingURL=Project.d.ts.map