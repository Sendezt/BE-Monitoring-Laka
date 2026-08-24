const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Korban = sequelize.define(
    "Korban",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        laporan_polisi_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        nama: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },

        usia: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        profesi_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        cidera_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        kendaraan_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        tindak_lanjut_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        jenis_jaminan_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        keterjaminan_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        rumah_sakit_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        rumah_sakit_wilayah: {
            type: DataTypes.STRING(150),
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
        tableName: "korban",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = Korban;