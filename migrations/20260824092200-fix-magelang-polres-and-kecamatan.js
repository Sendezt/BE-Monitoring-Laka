"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Rename Polres ID 7 to "Polres Magelang Kota"
    await queryInterface.sequelize.query(
      `UPDATE polres SET nama = 'Polres Magelang Kota' WHERE id = 7`
    );

    // 2. Map the 4 city sub-districts to Polres ID 7
    await queryInterface.sequelize.query(
      `UPDATE kecamatan SET polres_id = 7 WHERE id IN (260, 261, 262, 263)`
    );
  },

  async down(queryInterface, Sequelize) {
    // 1. Revert Polres ID 7 name back to "Polres Kab.Magelang"
    await queryInterface.sequelize.query(
      `UPDATE polres SET nama = 'Polres Kab.Magelang' WHERE id = 7`
    );

    // 2. Map the 4 city sub-districts back to Polres ID 6
    await queryInterface.sequelize.query(
      `UPDATE kecamatan SET polres_id = 6 WHERE id IN (260, 261, 262, 263)`
    );
  },
};
