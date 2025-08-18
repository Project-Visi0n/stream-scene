import { DataTypes, Model } from 'sequelize';
export class File extends Model {
}
export function initFileModel(sequelize) {
    File.init({
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
            set(val) {
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
    }, {
        sequelize,
        tableName: 'files',
        timestamps: true,
        createdAt: 'uploadedAt',
        updatedAt: 'updatedAt',
    });
    return File;
}
