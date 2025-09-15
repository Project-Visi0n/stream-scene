import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../db/connection.js';

interface CanvasAttributes {
  id: string; // Use string IDs for canvas names like 'project-center-main'
  userId: number; // Canvas owner
  name: string;
  description?: string | null;
  width: number;
  height: number;
  backgroundColor: string;
  isPublic: boolean; // Whether canvas can be discovered publicly
  allowAnonymousEdit: boolean; // Whether anonymous users can edit
  canvasData: string; // JSON string of canvas state (layers, objects, etc.)
  shareToken?: string | null; // Unique token for sharing
  version: number; // For conflict resolution
  maxCollaborators: number; // Maximum number of collaborators
  lastActivity?: Date | null; // Last activity timestamp
  lastEditedBy?: number | null; // Last user who edited
  lastEditedByGuest?: string | null; // Last guest who edited
  createdAt: Date;
  updatedAt: Date;
}

interface CanvasCreationAttributes extends Optional<CanvasAttributes, 'id' | 'description' | 'shareToken' | 'version' | 'maxCollaborators' | 'lastActivity' | 'lastEditedBy' | 'lastEditedByGuest' | 'createdAt' | 'updatedAt'> {}

class Canvas extends Model<CanvasAttributes, CanvasCreationAttributes> implements CanvasAttributes {
  // Remove public field declarations to avoid shadowing Sequelize getters/setters
  // These properties will be available via Sequelize's getters/setters
  declare id: string;
  declare userId: number;
  declare name: string;
  declare description: string | null;
  declare width: number;
  declare height: number;
  declare backgroundColor: string;
  declare isPublic: boolean;
  declare allowAnonymousEdit: boolean;
  declare canvasData: string;
  declare shareToken: string | null;
  declare version: number;
  declare maxCollaborators: number;
  declare lastActivity: Date | null;
  declare lastEditedBy: number | null;
  declare lastEditedByGuest: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Association helpers
  declare readonly user?: any;
  declare readonly collaborators?: any[];
  declare readonly comments?: any[];
}

Canvas.init(
  {
    id: {
      type: DataTypes.STRING(255),
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 800,
      validate: {
        min: 100,
        max: 4000,
      },
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 600,
      validate: {
        min: 100,
        max: 4000,
      },
    },
    backgroundColor: {
      type: DataTypes.STRING(7), // Hex color code
      allowNull: false,
      defaultValue: '#ffffff',
      validate: {
        is: /^#[0-9A-F]{6}$/i, // Hex color validation
      },
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    allowAnonymousEdit: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    canvasData: {
      type: DataTypes.TEXT('long'), // Large text field for canvas state
      allowNull: false,
    },
    shareToken: {
      type: DataTypes.STRING(32),
      allowNull: true,
      unique: true,
      comment: 'Unique token for sharing canvas',
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Version number for conflict resolution',
    },
    lastEditedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    lastEditedByGuest: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Guest identifier for last editor',
    },
    maxCollaborators: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: 1,
        max: 100,
      },
    },
    lastActivity: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last activity timestamp',
    },
    createdAt: {
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
    sequelize: getSequelize(),
    modelName: 'Canvas',
    tableName: 'canvases',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['isPublic'] },
    ],
  }
);

export default Canvas;