import { DataTypes, Sequelize, Model, Optional } from 'sequelize';
import { getSequelize } from '../db/connection.js';

// User attributes interface
interface UserAttributes {
  id: number;
  email: string;
  name: string;
  google_id?: string;
  threadsAccessToken?: string; 
  threadsUserId?: string;        
  created_at?: Date;
  updated_at?: Date;
}

// Creation attributes (optional id and timestamps)
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at'> {}

// Sequelize User model class
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare email: string;
  declare name: string;
  declare google_id?: string;
  declare threadsAccessToken?: string;  
  declare threadsUserId?: string;        
  declare created_at?: Date;
  declare updated_at?: Date;

  // Compatibility getters for the old in-memory model properties
  get googleId(): string | undefined {
    return this.google_id;
  }

  get firstName(): string {
    return this.name.split(' ')[0] || '';
  }

  get lastName(): string {
    const parts = this.name.split(' ');
    return parts.slice(1).join(' ') || '';
  }

  get profilePic(): string | undefined {
    return undefined; // Not implemented yet
  }
}

// Initialize the model with the database connection
const sequelize = getSequelize();

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    google_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    // ✅ ADD THESE TWO FIELDS:
    threadsAccessToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'threads_access_token',  // Database column name (snake_case)
    },
    threadsUserId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'threads_user_id',  // Database column name (snake_case)
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default User;