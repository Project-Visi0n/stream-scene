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
  date: Date;
  project_id?: string;
  receipt_title?: string;
  ocr_scanned: boolean;
  ocr_confidence?: number;
  tags?: string[];
  created_at: Date;
  updated_at: Date;
}

// Creation attributes (optional id and timestamps)
type BudgetEntryCreationAttributes = Optional<BudgetEntryAttributes, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'receipt_title' | 'ocr_scanned' | 'ocr_confidence' | 'tags'>;

// Sequelize BudgetEntry model class
export class BudgetEntry extends Model<BudgetEntryAttributes, BudgetEntryCreationAttributes> implements BudgetEntryAttributes {
  public id!: string;
  public user_id!: number;
  public type!: 'income' | 'expense';
  public amount!: number;
  public category!: string;
  public description!: string;
  public date!: Date;
  public project_id?: string;
  public receipt_title?: string;
  public ocr_scanned!: boolean;
  public ocr_confidence?: number;
  public tags?: string[];
  public created_at!: Date;
  public updated_at!: Date;
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
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
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