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
        comment: "CREATE | UPDATE | DELETE",
      },

      tabel: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: "Nama tabel yang diubah, misal: laporan_polisi",
      },

      record_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: "ID record yang diubah",
      },

      data_lama: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "JSON data sebelum diubah",
      },

      data_baru: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "JSON data setelah diubah",
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
        comment: "FK ke users — siapa yang melakukan aksi",
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
