import { DataTypes, Model } from 'sequelize';
import { getSequelize } from '../db/connection.js';
class Comment extends Model {
}
Comment.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    fileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'files',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    userId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'SET NULL', // Keep comment if user is deleted
    },
    guestName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            len: [1, 100],
        },
    },
    guestIdentifier: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Session/browser identifier for anonymous users',
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 2000], // Max 2000 characters
        },
    },
    timestampSeconds: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        validate: {
            min: 0,
        },
    },
    parentCommentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'comments',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    isModerationHidden: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Hidden by file owner moderation',
    },
    isEdited: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Track if comment has been edited',
    },
    isModerated: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Track if comment has been moderated',
    },
    moderatedReason: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Reason for moderation action',
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
}, {
    sequelize: getSequelize(),
    modelName: 'Comment',
    tableName: 'comments',
    timestamps: true,
    indexes: [
        { fields: ['fileId'] },
        { fields: ['userId'] },
        { fields: ['guestIdentifier'] },
        { fields: ['parentCommentId'] },
        { fields: ['timestampSeconds'] },
        { fields: ['createdAt'] },
        { fields: ['isDeleted', 'isModerationHidden'] }, // For filtering visible comments
    ],
});
export default Comment;
