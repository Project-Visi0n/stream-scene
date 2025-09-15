import { DataTypes, Model, Optional, Op } from 'sequelize';
import { getSequelize } from '../db/connection.js';

interface CanvasCollaboratorAttributes {
  id: number;
  canvasId: string; // Changed to string to match Canvas.id
  userId?: number | null; // Nullable for anonymous collaborators
  guestIdentifier?: string | null; // For anonymous collaborators
  guestName?: string | null; // Display name for anonymous users
  permission: 'view' | 'edit' | 'admin';
  isActive: boolean; // Whether user is currently active on canvas
  joinedAt: Date; // When user joined as collaborator
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CanvasCollaboratorCreationAttributes extends Optional<CanvasCollaboratorAttributes, 'id' | 'userId' | 'guestIdentifier' | 'guestName' | 'isActive' | 'joinedAt' | 'lastSeenAt' | 'createdAt' | 'updatedAt'> {}

class CanvasCollaborator extends Model<CanvasCollaboratorAttributes, CanvasCollaboratorCreationAttributes> implements CanvasCollaboratorAttributes {
  // Remove public field declarations to avoid shadowing Sequelize getters/setters
  declare id: number;
  declare canvasId: string; // Changed to string to match Canvas.id
  declare userId: number | null;
  declare guestIdentifier: string | null;
  declare guestName: string | null;
  declare permission: 'view' | 'edit' | 'admin';
  declare isActive: boolean;
  declare joinedAt: Date;
  declare lastSeenAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Association helpers
  declare readonly canvas?: any;
  declare readonly user?: any;
}

CanvasCollaborator.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    canvasId: {
      type: DataTypes.STRING, // Changed to STRING to match Canvas.id
      allowNull: false,
      references: {
        model: 'canvases',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: true, // Allow null for anonymous collaborators
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    guestIdentifier: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Session/browser identifier for anonymous collaborators',
    },
    guestName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [1, 100],
      },
    },
    permission: {
      type: DataTypes.ENUM('view', 'edit', 'admin'),
      allowNull: false,
      defaultValue: 'edit',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When user joined as collaborator',
    },
    lastSeenAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
    modelName: 'CanvasCollaborator',
    tableName: 'canvas_collaborators',
    timestamps: true,
    indexes: [
      { fields: ['canvasId'] },
      { fields: ['userId'] },
      { fields: ['guestIdentifier'] },
      { fields: ['isActive'] },
      // Unique constraint: one collaborator per user per canvas
      { 
        fields: ['canvasId', 'userId'], 
        unique: true,
        where: { userId: { [Op.ne]: null } }
      },
      { 
        fields: ['canvasId', 'guestIdentifier'], 
        unique: true,
        where: { guestIdentifier: { [Op.ne]: null } }
      }
    ],
  }
);

export default CanvasCollaborator;