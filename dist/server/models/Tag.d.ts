import { Model } from 'sequelize-typescript';
import { User } from '../models/User';
import { Todo } from './Todo';
import { Media } from './Media';
export declare class Tag extends Model {
    id: number;
    tag_name: string;
    description: string;
    user_id: number;
    user: User;
    todos: Todo[];
    media: Media[];
}
//# sourceMappingURL=Tag.d.ts.map