import { Model, DataTypes } from 'sequelize';
import sequelize from '../db/db';

export interface ProjectUserAttributes {
  user_id: number;
  project_id: number;
}

class ProjectUser
  extends Model<ProjectUserAttributes>
  implements ProjectUserAttributes
{
  public user_id!: number;
  public project_id!: number;
}

ProjectUser.init(
  {
    user_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
    },
  },
  {
    sequelize,
    modelName: 'ProjectUser',
    tableName: 'Project_users',
    timestamps: false,
  }
);

export default ProjectUser;
