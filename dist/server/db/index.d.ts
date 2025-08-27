import { Sequelize } from 'sequelize';
export declare const getSequelize: () => Sequelize;
import { Share } from '../models/Share.js';
import { SocialAccountToken } from '../models/initSocialAccountToken.js';
import { ScheduledPost } from '../models/initScheduledPost.js';
export declare const associate: () => void;
export declare const testConnection: () => Promise<void>;
export declare const syncDB: (force?: boolean) => Promise<void>;
export declare const db: {
    sequelize: Sequelize;
    File: typeof import("../models/initFileModel.js").File;
    Share: typeof Share;
    SocialAccountToken: typeof SocialAccountToken;
    ScheduledPost: typeof ScheduledPost;
    associate: () => void;
};
export type DB = typeof db;
export default db;
//# sourceMappingURL=index.d.ts.map