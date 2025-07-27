import {
  Model,
  DataTypes,
  Optional,
} from 'sequelize';
import sequelize from '../db/db';
import User from './User';

export interface NoteAttributes {
  id: number;
  user_id?: number | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  tags?: string | null;
}

export interface NoteCreationAttributes
  extends Optional<NoteAttributes, 'id'> {}

class Note
  extends Model<NoteAttributes, NoteCreationAttributes>
  implements NoteAttributes
{
  public id!: number;
  public user_id!: number | null;
  public created_at!: Date | null;
  public updated_at!: Date | null;
  public tags!: string | null;
}

Note.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Note',
    tableName: 'Notes',
    timestamps: false, 
  }
);

// ----- Associations -----
Note.belongsTo(User, { foreignKey: 'user_id' });

export default Note;
