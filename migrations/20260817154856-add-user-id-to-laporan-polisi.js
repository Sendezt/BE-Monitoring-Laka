'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("laporan_polisi", "user_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: "FK ke users — siapa yang menginput laporan ini",
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("laporan_polisi", "user_id");
  }
};
