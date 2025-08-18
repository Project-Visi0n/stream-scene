import { DataTypes, Model } from 'sequelize';
import { SocialAccountToken } from './initSocialAccountToken.js';
export class ScheduledPost extends Model {
}
export function initScheduledPostModel(sequelize) {
    ScheduledPost.init({
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        socialAccountTokenId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        text: { type: DataTypes.TEXT, allowNull: false },
        media: { type: DataTypes.JSON, allowNull: true },
        scheduledFor: { type: DataTypes.DATE, allowNull: false },
        status: { type: DataTypes.ENUM('pending', 'queued', 'published', 'failed'), allowNull: false, defaultValue: 'pending' },
        errorMessage: { type: DataTypes.TEXT, allowNull: true },
        publishedPostId: { type: DataTypes.STRING, allowNull: true },
    }, { sequelize, tableName: 'ScheduledPosts' });
    // association
    ScheduledPost.belongsTo(SocialAccountToken, { foreignKey: 'socialAccountTokenId', as: 'account' });
    return ScheduledPost;
}
