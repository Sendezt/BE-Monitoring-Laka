const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RumahSakit = sequelize.define(
    "RumahSakit",
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

        nama_pic: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },

        no_hp_pic: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },

        kode_rumah_sakit: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },

        wilayah_id: {
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
        tableName: "rumah_sakit",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = RumahSakit;