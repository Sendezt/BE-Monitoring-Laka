const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LaporanPolisi = sequelize.define(
  "LaporanPolisi",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    no_lp: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    polres_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Polres yang menangani laporan polisi",
    },

    tanggal_laka: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    hari_kejadian: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    tanggal_lp: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    telat_lp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    kecamatan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    kelurahan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    lokasi_laka: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    rumah_sakit_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    rumah_sakit_wilayah: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    laka_tunggal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },



    kasus_tabrak_kecelakaan_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    faktor_penyebab_laka_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    sifat_laka_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    keterangan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "FK ke users — siapa yang menginput laporan ini",
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
    tableName: "laporan_polisi",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = LaporanPolisi;
