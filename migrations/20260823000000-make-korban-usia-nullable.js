"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Izinkan usia korban kosong (data dari migrasi sheet kadang tidak lengkap)
    await queryInterface.changeColumn("korban", "usia", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("korban", "usia", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
