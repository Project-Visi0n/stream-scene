// MediaTag.ts
import { Model, DataTypes } from 'sequelize';
import sequelize from '../db/db';

export interface MediaTagAttributes {
  media_id: number;
  tag_id: number;
}

class MediaTag extends Model<MediaTagAttributes> implements MediaTagAttributes {
  public media_id!: number;
  public tag_id!: number;
}

MediaTag.init(
  {
    media_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'Media',
        key: 'id',
      },
    },
    tag_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'tags',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'MediaTag',
    tableName: 'Media_tags',
    timestamps: false,
  }
);

export default MediaTag;
