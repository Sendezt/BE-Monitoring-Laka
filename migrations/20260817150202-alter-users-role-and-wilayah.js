'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Ubah role dari VARCHAR menjadi ENUM
    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM("admin", "user"),
      allowNull: false,
    });

    // 2. Ubah wilayah_id menjadi nullable
    await queryInterface.changeColumn("users", "wilayah_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Kembalikan wilayah_id menjadi NOT NULL
    await queryInterface.changeColumn("users", "wilayah_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    // Kembalikan role menjadi VARCHAR
    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.STRING(50),
      allowNull: false,
    });
  },
};
