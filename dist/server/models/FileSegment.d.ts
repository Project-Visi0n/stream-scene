import { Model } from 'sequelize-typescript';
import { Note } from './Note';
export declare class FileSegment extends Model {
    id: number;
    note_id: number;
    path: string;
    note: Note;
}
//# sourceMappingURL=FileSegment.d.ts.map