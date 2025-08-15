// server/models/initSocialAccountToken.ts
import { DataTypes, Sequelize, Model, Optional } from 'sequelize';

export interface SocialAccountTokenAttrs {
  id: number;
  appUserId: number;              // <- StreamScene user id
  provider: 'threads';
  accountId: string;              // Threads user id (or 'me')
  accessToken: string;            // Long-lived Threads token
  expiresAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type Creation = Optional<SocialAccountTokenAttrs, 'id'|'expiresAt'|'provider'>;

export class SocialAccountToken extends Model<SocialAccountTokenAttrs, Creation>
  implements SocialAccountTokenAttrs {
  public id!: number;
  public appUserId!: number;
  public provider!: 'threads';
  public accountId!: string;
  public accessToken!: string;
  public expiresAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initSocialAccountTokenModel(sequelize: Sequelize) {
  SocialAccountToken.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      appUserId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      provider: { type: DataTypes.ENUM('threads'), allowNull: false, defaultValue: 'threads' },
      accountId: { type: DataTypes.STRING(64), allowNull: false },
      accessToken: { type: DataTypes.TEXT, allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      tableName: 'social_account_tokens',
      indexes: [{ unique: true, fields: ['appUserId', 'provider', 'accountId'] }],
    }
  );
  return SocialAccountToken;
}
