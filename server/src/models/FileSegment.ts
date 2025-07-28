import {
  Model,
  DataTypes,
  Optional,
} from 'sequelize';
import sequelize from '../db/db';
import Note from './Note';

export interface FileSegmentAttributes {
  id: number;
  note_id?: number | null;
  path?: string | null;
}

export interface FileSegmentCreationAttributes
  extends Optional<FileSegmentAttributes, 'id'> {}

class FileSegment
  extends Model<FileSegmentAttributes, FileSegmentCreationAttributes>
  implements FileSegmentAttributes
{
  public id!: number;
  public note_id!: number | null;
  public path!: string | null;
}

FileSegment.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    note_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    path: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'FileSegment',
    tableName: '`File Segment`', 
    timestamps: false,
  }
);

// ----- Associations -----
FileSegment.belongsTo(Note, { foreignKey: 'note_id' });

export default FileSegment;
