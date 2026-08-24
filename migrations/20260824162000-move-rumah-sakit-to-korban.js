"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add columns to korban
    await queryInterface.addColumn("korban", "rumah_sakit_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "rumah_sakit",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addColumn("korban", "rumah_sakit_wilayah", {
      type: Sequelize.STRING(150),
      allowNull: true,
    });

    // 2. Migrate existing data from laporan_polisi to korban
    await queryInterface.sequelize.query(`
      UPDATE korban k
      JOIN laporan_polisi l ON k.laporan_polisi_id = l.id
      SET k.rumah_sakit_id = l.rumah_sakit_id,
          k.rumah_sakit_wilayah = l.rumah_sakit_wilayah
    `);

    // 3. Drop foreign key constraint on laporan_polisi.rumah_sakit_id
    // Under MySQL, dropping a column that has a foreign key constraint will fail.
    // So we drop the foreign key first.
    try {
      await queryInterface.removeConstraint("laporan_polisi", "laporan_polisi_ibfk_3");
    } catch (err) {
      console.warn("Could not drop constraint laporan_polisi_ibfk_3, it may not exist: ", err.message);
    }

    // 4. Remove columns from laporan_polisi
    await queryInterface.removeColumn("laporan_polisi", "rumah_sakit_id");
    await queryInterface.removeColumn("laporan_polisi", "rumah_sakit_wilayah");
  },

  async down(queryInterface, Sequelize) {
    // 1. Add columns back to laporan_polisi
    await queryInterface.addColumn("laporan_polisi", "rumah_sakit_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "rumah_sakit",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addColumn("laporan_polisi", "rumah_sakit_wilayah", {
      type: Sequelize.STRING(150),
      allowNull: true,
    });

    // 2. Migrate data back from korban to laporan_polisi (using the first victim's hospital as fallback)
    await queryInterface.sequelize.query(`
      UPDATE laporan_polisi l
      JOIN (
        SELECT laporan_polisi_id, MIN(id) as min_id
        FROM korban
        WHERE is_active = 1 AND (rumah_sakit_id IS NOT NULL OR rumah_sakit_wilayah IS NOT NULL)
        GROUP BY laporan_polisi_id
      ) k_min ON l.id = k_min.laporan_polisi_id
      JOIN korban k ON k.id = k_min.min_id
      SET l.rumah_sakit_id = k.rumah_sakit_id,
          l.rumah_sakit_wilayah = k.rumah_sakit_wilayah
    `);

    // 3. Remove columns from korban
    await queryInterface.removeColumn("korban", "rumah_sakit_id");
    await queryInterface.removeColumn("korban", "rumah_sakit_wilayah");
  },
};
