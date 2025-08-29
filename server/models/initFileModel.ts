import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface FileAttributes {
  id: number;
  userId: number;
  name: string;
  originalName: string;
  type: string;
  size: number;
  s3Key?: string;
  url: string;
  tags?: string; // Stored as comma-separated string
  uploadedAt: Date;
  updatedAt: Date;
  captionUrl?: string; 
}

export interface FileCreationAttributes extends Optional<FileAttributes, 'id' | 'tags' | 's3Key'> {}

export class File extends Model<FileAttributes, FileCreationAttributes> implements FileAttributes {
  declare id: number;
  declare userId: number;
  declare name: string;
  declare originalName: string;
  declare type: string;
  declare size: number;
  declare s3Key?: string;
  declare url: string;
  declare tags?: string;
  declare uploadedAt: Date;
  declare updatedAt: Date;
  declare captionUrl?: string;
}

export function initFileModel(sequelize: Sequelize) {
  File.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      originalName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      size: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      s3Key: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tags: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const rawValue = this.getDataValue('tags');
          return rawValue ? rawValue.split(',') : [];
        },
        set(val: string[] | string) {
          this.setDataValue('tags', Array.isArray(val) ? val.join(',') : val);
        },
      },
      uploadedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      captionUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'files',
      timestamps: true,
      createdAt: 'uploadedAt',
      updatedAt: 'updatedAt',
    }
  );
  return File;
}
