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
}

export interface FileCreationAttributes extends Optional<FileAttributes, 'id' | 'tags' | 's3Key'> {}

export class File extends Model<FileAttributes, FileCreationAttributes> implements FileAttributes {
  public id!: number;
  public userId!: number;
  public name!: string;
  public originalName!: string;
  public type!: string;
  public size!: number;
  public s3Key?: string;
  public url!: string;
  public tags?: string;
  public uploadedAt!: Date;
  public updatedAt!: Date;
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
        type: DataTypes.STRING,
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
