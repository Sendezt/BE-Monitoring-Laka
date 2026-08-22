"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Izinkan lokasi_laka kosong (data migrasi sheet kadang tidak lengkap)
    await queryInterface.changeColumn("laporan_polisi", "lokasi_laka", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("laporan_polisi", "lokasi_laka", {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
  },
};
