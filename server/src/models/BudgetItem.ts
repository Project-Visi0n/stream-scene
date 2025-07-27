import {
  Model,
  DataTypes,
  Optional,
} from 'sequelize';
import sequelize from '../db/db'; // ← your new db file path

export interface BudgetItemAttributes {
  id: number;
  project_id?: number | null;
  created_at?: Date | null;
  dollar_limit?: string | null;
  dollar_current?: string | null;
  description?: string | null;
}

export interface BudgetItemCreationAttributes
  extends Optional<BudgetItemAttributes, 'id'> {}

class BudgetItem
  extends Model<BudgetItemAttributes, BudgetItemCreationAttributes>
  implements BudgetItemAttributes
{
  public id!: number;
  public project_id!: number | null;
  public created_at!: Date | null;
  public dollar_limit!: string | null;
  public dollar_current!: string | null;
  public description!: string | null;
}

BudgetItem.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    project_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dollar_limit: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dollar_current: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'BudgetItem',
    tableName: 'Budget Item',
    timestamps: false,
  }
);

export default BudgetItem;
