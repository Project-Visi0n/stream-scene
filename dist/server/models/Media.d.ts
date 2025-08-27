import { Model } from 'sequelize-typescript';
import { User } from '../models/User';
import { Comment } from './Comment';
import { Tag } from './Tag';
export declare class Media extends Model {
    id: number;
    user_id: number;
    file_id: string;
    format: string;
    description: string;
    title: string;
    created_at: Date;
    external_link: string;
    user: User;
    comments: Comment[];
    tags: Tag[];
}
//# sourceMappingURL=Media.d.ts.map