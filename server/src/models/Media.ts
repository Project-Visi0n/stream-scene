import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db/db';

export interface MediaAttributes {
  id: number;
  user_id?: number | null;
  file_id?: string | null;
  format?: string | null;
  description?: string | null;
  title?: string | null;
  created_at?: Date | null;
  external_link?: string | null;
}

export interface MediaCreationAttributes extends Optional<MediaAttributes, 'id'> {}

class Media extends Model<MediaAttributes, MediaCreationAttributes> implements MediaAttributes {
  public id!: number;
  public user_id!: number | null;
  public file_id!: string | null;
  public format!: string | null;
  public description!: string | null;
  public title!: string | null;
  public created_at!: Date | null;
  public external_link!: string | null;
}

Media.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    file_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    format: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    external_link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Media',
    tableName: 'media', 
    timestamps: false,
  }
);

export default Media;
