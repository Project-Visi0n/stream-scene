import { Sequelize, Model, Optional } from 'sequelize';
export interface SocialAccountTokenAttrs {
    id: number;
    appUserId: number;
    provider: 'threads';
    accountId: string;
    accessToken: string;
    expiresAt: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}
type Creation = Optional<SocialAccountTokenAttrs, 'id' | 'expiresAt' | 'provider'>;
export declare class SocialAccountToken extends Model<SocialAccountTokenAttrs, Creation> implements SocialAccountTokenAttrs {
    id: number;
    appUserId: number;
    provider: 'threads';
    accountId: string;
    accessToken: string;
    expiresAt: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initSocialAccountTokenModel(sequelize: Sequelize): typeof SocialAccountToken;
export {};
//# sourceMappingURL=initSocialAccountToken.d.ts.map