import { Model } from 'sequelize-typescript';
import { SocialAccountToken } from './SocialAccountToken.js';
export type PostStatus = 'pending' | 'queued' | 'published' | 'failed';
export declare class ScheduledPost extends Model {
    id: number;
    socialAccountTokenId: number;
    account: SocialAccountToken;
    text: string;
    media?: {
        imageUrls?: string[];
        videoUrl?: string | null;
    } | null;
    scheduledFor: Date;
    status: PostStatus;
    errorMessage?: string | null;
    publishedPostId?: string | null;
}
//# sourceMappingURL=ScheduledPost.d.ts.map