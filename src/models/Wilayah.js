const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Wilayah = sequelize.define(
  "Wilayah",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    nama: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "wilayah",
    timestamps: false,
  },
);

module.exports = Wilayah;
