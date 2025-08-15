// server/models/initSocialAccountToken.ts
import { DataTypes, Model } from 'sequelize';
export class SocialAccountToken extends Model {
}
export function initSocialAccountTokenModel(sequelize) {
    SocialAccountToken.init({
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        appUserId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        provider: { type: DataTypes.ENUM('threads'), allowNull: false, defaultValue: 'threads' },
        accountId: { type: DataTypes.STRING(64), allowNull: false },
        accessToken: { type: DataTypes.TEXT, allowNull: false },
        expiresAt: { type: DataTypes.DATE, allowNull: true },
    }, {
        sequelize,
        tableName: 'social_account_tokens',
        indexes: [{ unique: true, fields: ['appUserId', 'provider', 'accountId'] }],
    });
    return SocialAccountToken;
}
//# sourceMappingURL=initSocialAccountToken.js.map