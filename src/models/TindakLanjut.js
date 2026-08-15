const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TindakLanjut = sequelize.define(
    "TindakLanjut",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        nama: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },

        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
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
    },
    {
        tableName: "tidak_lanjut",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = TindakLanjut;