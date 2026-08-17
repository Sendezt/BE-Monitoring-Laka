"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("laporan_polisi", "polres_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: "Polres yang menangani laporan polisi",
      references: {
        model: "polres",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("laporan_polisi", "polres_id");
  },
};
