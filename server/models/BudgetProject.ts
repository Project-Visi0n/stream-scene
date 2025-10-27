import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../db/connection.js';

// BudgetProject attributes interface
interface BudgetProjectAttributes {
  id: string;
  user_id: number;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  tags?: string[];
  created_at: Date;
  updated_at: Date;
}

// Creation attributes (optional id and timestamps)
type BudgetProjectCreationAttributes = Optional<BudgetProjectAttributes, 'id' | 'created_at' | 'updated_at' | 'description' | 'tags' | 'is_active'>;

// Sequelize BudgetProject model class
export class BudgetProject extends Model<BudgetProjectAttributes, BudgetProjectCreationAttributes> implements BudgetProjectAttributes {
  public id!: string;
  public user_id!: number;
  public name!: string;
  public description?: string;
  public color!: string;
  public is_active!: boolean;
  public tags?: string[];
  public created_at!: Date;
  public updated_at!: Date;
}

// Initialize the model with the database connection
const sequelize = getSequelize();

BudgetProject.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#8b5cf6',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'budget_projects',
    modelName: 'BudgetProject',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default BudgetProject;