import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, AllowNull, Unique } from 'sequelize-typescript';

@Table({ tableName: 'SocialAccountTokens', timestamps: true })
export class SocialAccountToken extends Model {
  @PrimaryKey @AutoIncrement @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false) @Unique @Column(DataType.STRING)
  accountId!: string; // Threads numeric user id as string

  @AllowNull(false) @Column(DataType.TEXT)
  accessToken!: string;

  @AllowNull(true) @Column(DataType.DATE)
  expiresAt?: Date | null;
}
