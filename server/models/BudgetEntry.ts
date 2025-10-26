import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../db/connection.js';

// BudgetEntry attributes interface
interface BudgetEntryAttributes {
  id: string;
  user_id: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  project_id?: string;
  receipt_title?: string;
  ocr_scanned?: boolean;
  ocr_confidence?: number;
  tags?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Creation attributes (optional id and timestamps)
type BudgetEntryCreationAttributes = Optional<BudgetEntryAttributes, 'id' | 'created_at' | 'updated_at'>;

// Sequelize BudgetEntry model class
export class BudgetEntry extends Model<BudgetEntryAttributes, BudgetEntryCreationAttributes> implements BudgetEntryAttributes {
  declare id: string;
  declare user_id: number;
  declare type: 'income' | 'expense';
  declare amount: number;
  declare category: string;
  declare description: string;
  declare date: string;
  declare project_id?: string;
  declare receipt_title?: string;
  declare ocr_scanned?: boolean;
  declare ocr_confidence?: number;
  declare tags?: string;
  declare created_at?: Date;
  declare updated_at?: Date;
}

// Initialize the model with the database connection
const sequelize = getSequelize();

BudgetEntry.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('income', 'expense'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'budget_projects',
        key: 'id',
      },
    },
    receipt_title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ocr_scanned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    ocr_confidence: {
      type: DataTypes.FLOAT,
      allowNull: true,
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
    tableName: 'budget_entries',
    modelName: 'BudgetEntry',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default BudgetEntry;