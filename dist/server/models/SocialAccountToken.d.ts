import { Model } from 'sequelize-typescript';
export declare class SocialAccountToken extends Model {
    id: number;
    accountId: string;
    accessToken: string;
    expiresAt?: Date | null;
}
//# sourceMappingURL=SocialAccountToken.d.ts.map