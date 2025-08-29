import { DataTypes, Model } from 'sequelize';
import { getSequelize } from '../db/connection.js';
// Sequelize User model class
export class User extends Model {
    // Compatibility getters for the old in-memory model properties
    get googleId() {
        return this.google_id;
    }
    get firstName() {
        return this.name.split(' ')[0] || '';
    }
    get lastName() {
        const parts = this.name.split(' ');
        return parts.slice(1).join(' ') || '';
    }
    get profilePic() {
        return undefined; // Not implemented yet
    }
}
// Initialize the model with the database connection
const sequelize = getSequelize();
User.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    google_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});
export default User;
