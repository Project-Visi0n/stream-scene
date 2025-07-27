import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db/db';
import User from './User';
import Todo from './Todos';
import TodoTag from './TodoTag';
import Media from './Media';
import MediaTag from './MediaTag';

export interface TagAttributes {
  id: number;
  tag_name?: string | null;
  description?: string | null;
  user_id?: number | null;
}

export interface TagCreationAttributes extends Optional<TagAttributes, 'id'> {}

class Tag extends Model<TagAttributes, TagCreationAttributes> implements TagAttributes {
  public id!: number;
  public tag_name!: string | null;
  public description!: string | null;
  public user_id!: number | null;

  // Associations (optional but helpful in intellisense)
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Tag.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    tag_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Tag',
    tableName: 'tags',
    timestamps: false,
  }
);

// ----- Associations -----
Tag.belongsTo(User, { foreignKey: 'user_id' });
Tag.belongsToMany(Todo, { through: TodoTag, foreignKey: 'tag_id' });
Tag.belongsToMany(Media, { through: MediaTag, foreignKey: 'tag_id' });

export default Tag;
