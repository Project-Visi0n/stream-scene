import { DataTypes, Model, Optional } from 'sequelize';
import db from '../db/index';

export interface UserAttributes {
  id: number;
  googleId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePic?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public googleId!: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public profilePic?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Static method to find by Google ID
  static async findByGoogleId(googleId: string): Promise<User | null> {
    return await User.findOne({
      where: { googleId }
    });
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  profilePic: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize: db.sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['googleId'], unique: true },
    { fields: ['email'], unique: true },
  ],
});

export default User;