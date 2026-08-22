'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("kendaraan", "laporan_polisi_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.changeColumn("kendaraan", "peran", {
      type: Sequelize.ENUM("korban", "penjamin"),
      allowNull: true,
    });

    await queryInterface.changeColumn("kendaraan", "jenis_kendaraan_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.changeColumn("kendaraan", "nopol", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("kendaraan", "laporan_polisi_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.changeColumn("kendaraan", "peran", {
      type: Sequelize.ENUM("korban", "penjamin"),
      allowNull: false,
    });

    await queryInterface.changeColumn("kendaraan", "jenis_kendaraan_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.changeColumn("kendaraan", "nopol", {
      type: Sequelize.STRING(20),
      allowNull: false,
    });
  }
};
