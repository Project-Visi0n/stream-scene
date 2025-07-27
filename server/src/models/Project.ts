import {
  Model,
  DataTypes,
  Optional,
} from 'sequelize';
import sequelize from '../db/db';
import User from './User';
import BudgetItem from './BudgetItem';
import ProjectUser from './ProjectUser';

export interface ProjectAttributes {
  id: number;
  googlesheets_id?: number | null;
  created_at?: number | null;
}

export interface ProjectCreationAttributes
  extends Optional<ProjectAttributes, 'id'> {}

class Project
  extends Model<ProjectAttributes, ProjectCreationAttributes>
  implements ProjectAttributes
{
  public id!: number;
  public googlesheets_id!: number | null;
  public created_at!: number | null;
}

Project.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    googlesheets_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Project',
    tableName: 'Project',
    timestamps: false,
  }
);

// Associations
Project.belongsToMany(User, {
  through: ProjectUser,
  foreignKey: 'project_id',
});
Project.hasMany(BudgetItem, { foreignKey: 'project_id' });

export default Project;
