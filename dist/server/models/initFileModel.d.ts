import { Model, Optional, Sequelize } from 'sequelize';
export interface FileAttributes {
    id: number;
    userId: number;
    name: string;
    originalName: string;
    type: string;
    size: number;
    s3Key?: string;
    url: string;
    tags?: string;
    uploadedAt: Date;
    updatedAt: Date;
    captionUrl?: string;
}
export interface FileCreationAttributes extends Optional<FileAttributes, 'id' | 'tags' | 's3Key'> {
}
export declare class File extends Model<FileAttributes, FileCreationAttributes> implements FileAttributes {
    id: number;
    userId: number;
    name: string;
    originalName: string;
    type: string;
    size: number;
    s3Key?: string;
    url: string;
    tags?: string;
    uploadedAt: Date;
    updatedAt: Date;
    captionUrl?: string;
}
export declare function initFileModel(sequelize: Sequelize): typeof File;
//# sourceMappingURL=initFileModel.d.ts.map