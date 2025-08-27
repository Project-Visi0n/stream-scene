import { Sequelize, Model, Optional } from 'sequelize';
export type PostStatus = 'pending' | 'queued' | 'published' | 'failed';
export interface ScheduledPostAttributes {
    id: number;
    socialAccountTokenId: number;
    text: string;
    media?: {
        imageUrls?: string[];
        videoUrl?: string | null;
    } | null;
    scheduledFor: Date;
    status: PostStatus;
    errorMessage?: string | null;
    publishedPostId?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}
type CreationAttrs = Optional<ScheduledPostAttributes, 'id' | 'media' | 'status' | 'errorMessage' | 'publishedPostId' | 'createdAt' | 'updatedAt'>;
export declare class ScheduledPost extends Model<ScheduledPostAttributes, CreationAttrs> implements ScheduledPostAttributes {
    id: number;
    socialAccountTokenId: number;
    text: string;
    media: {
        imageUrls?: string[];
        videoUrl?: string | null;
    } | null;
    scheduledFor: Date;
    status: PostStatus;
    errorMessage: string | null;
    publishedPostId: string | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initScheduledPostModel(sequelize: Sequelize): typeof ScheduledPost;
export {};
//# sourceMappingURL=initScheduledPost.d.ts.map