const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Kelurahan = sequelize.define(
    "Kelurahan",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        nama: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },

        kecamatan_id: {
            type: DataTypes.INTEGER,
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
        tableName: "kelurahan",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = Kelurahan;