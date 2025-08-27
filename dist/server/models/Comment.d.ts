import { Model } from 'sequelize-typescript';
import { User } from '../models/User';
import { Media } from './Media';
export declare class Comment extends Model {
    id: number;
    user_id: number;
    media_id: number;
    parent_id: number;
    comment_body: string;
    created_at: Date;
    user: User;
    media: Media;
    parent: Comment;
    replies: Comment[];
}
//# sourceMappingURL=Comment.d.ts.map