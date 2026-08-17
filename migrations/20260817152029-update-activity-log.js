'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("activity_log", {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      aksi: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },

      tabel: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },

      record_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },

      data_lama: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      data_baru: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },

      waktu: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      deskripsi: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("activity_log");
  }
};
