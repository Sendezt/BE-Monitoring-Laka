'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add columns to korban
    await queryInterface.addColumn('korban', 'tindak_lanjut_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('korban', 'jenis_jaminan_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('korban', 'keterjaminan_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // Remove columns from laporan_polisi
    await queryInterface.removeColumn('laporan_polisi', 'tindak_lanjut_id');
    await queryInterface.removeColumn('laporan_polisi', 'jenis_jaminan_id');
    await queryInterface.removeColumn('laporan_polisi', 'keterjaminan_id');
  },

  down: async (queryInterface, Sequelize) => {
    // Add columns back to laporan_polisi
    await queryInterface.addColumn('laporan_polisi', 'tindak_lanjut_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('laporan_polisi', 'jenis_jaminan_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('laporan_polisi', 'keterjaminan_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // Remove columns from korban
    await queryInterface.removeColumn('korban', 'tindak_lanjut_id');
    await queryInterface.removeColumn('korban', 'jenis_jaminan_id');
    await queryInterface.removeColumn('korban', 'keterjaminan_id');
  }
};
