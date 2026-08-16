// src/models/ActivityLog.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ActivityLog = sequelize.define(
    "ActivityLog",
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },

        aksi: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: "CREATE | UPDATE | DELETE",
        },

        tabel: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: "Nama tabel yang diubah, misal: laporan_polisi",
        },

        record_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            comment: "ID record yang diubah",
        },

        data_lama: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "JSON data sebelum diubah",
        },

        data_baru: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "JSON data setelah diubah",
        },

        ip_address: {
            type: DataTypes.STRING(45),
            allowNull: true,
        },

        waktu: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },

        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "FK ke users — siapa yang melakukan aksi",
        },
    },
    {
        tableName: "activity_log",
        timestamps: false, // Pakai field 'waktu' sendiri
    }
);

module.exports = ActivityLog;
