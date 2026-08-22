const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Kendaraan = sequelize.define(
    "Kendaraan",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        laporan_polisi_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        peran: {
            type: DataTypes.ENUM("korban", "penjamin"),
            allowNull: true,
        },

        jenis_kendaraan_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        nopol: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },

        masa_laku_sw: {
            type: DataTypes.DATEONLY,
            allowNull: true,
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
        tableName: "kendaraan",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = Kendaraan;