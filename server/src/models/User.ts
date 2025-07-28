import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db/db';

// --- User Attributes Interface ---
export interface UserAttributes {
  id: number;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  googleId?: string | null;
  profilePic?: string | null;
}

// --- Creation Attributes for Sequelize.create() ---
export interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

// --- Sequelize Model ---
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public name!: string | null;
  public firstName!: string | null;
  public lastName!: string | null;
  public email!: string | null;
  public googleId!: string | null;
  public profilePic!: string | null;
}

User.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'last_name',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      field: 'google_id',
    },
    profilePic: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'profile_pic',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: false,
  }
);

export default User;
