"use strict";

/**
 * Menambah index performa + unique index anti-duplikat.
 *
 * Index performa mempercepat query yang sering dipakai (dashboard, rekap,
 * export, list, activity log) — terutama saat data sudah besar.
 *
 * Unique index (no_lp + polres_id) mencegah duplikat laporan pada polres yang
 * sama di level database. AMAN dipasang bila data sudah bersih / kosong.
 *
 * Semua penambahan idempotent: dicek dulu apakah index sudah ada, agar migrasi
 * tidak gagal bila dijalankan pada DB yang sebagian index-nya sudah dibuat.
 */

module.exports = {
  async up(queryInterface) {
    const addIndexIfMissing = async (table, fields, options = {}) => {
      const indexName =
        options.name ||
        `${table}_${fields.join("_")}_idx`;
      // Ambil daftar index yang sudah ada
      const existing = await queryInterface.showIndex(table).catch(() => []);
      const already = existing.some((idx) => idx.name === indexName);
      if (already) {
        console.log(`  [skip] index ${indexName} sudah ada`);
        return;
      }
      await queryInterface.addIndex(table, fields, { ...options, name: indexName });
      console.log(`  [ok]  index ${indexName} dibuat`);
    };

    // ── laporan_polisi ──────────────────────────────────────────
    // Filter tanggal_lp + is_active dipakai hampir semua query.
    await addIndexIfMissing("laporan_polisi", ["is_active", "tanggal_lp"], {
      name: "lp_active_tgllp_idx",
    });
    // Filter gabungan polres + tanggal (dashboard/rekap per polres).
    await addIndexIfMissing("laporan_polisi", ["is_active", "polres_id", "tanggal_lp"], {
      name: "lp_active_polres_tgllp_idx",
    });
    // Sort/filter tanggal_laka (monitor, sebagian statistik).
    await addIndexIfMissing("laporan_polisi", ["tanggal_laka"], {
      name: "lp_tgllaka_idx",
    });
    // Cek duplikat migrasi + jaring pengaman anti-duplikat (UNIQUE).
    // Aman karena data akan dimulai dari kondisi bersih.
    await addIndexIfMissing("laporan_polisi", ["no_lp", "polres_id"], {
      name: "lp_nolp_polres_unique",
      unique: true,
    });

    // ── korban ──────────────────────────────────────────────────
    await addIndexIfMissing("korban", ["laporan_polisi_id", "is_active"], {
      name: "korban_lp_active_idx",
    });

    // ── kendaraan ───────────────────────────────────────────────
    await addIndexIfMissing("kendaraan", ["laporan_polisi_id", "is_active"], {
      name: "kendaraan_lp_active_idx",
    });

    // ── activity_log (paling cepat menggelembung) ───────────────
    await addIndexIfMissing("activity_log", ["waktu"], {
      name: "actlog_waktu_idx",
    });
    await addIndexIfMissing("activity_log", ["user_id"], {
      name: "actlog_user_idx",
    });
    await addIndexIfMissing("activity_log", ["tabel"], {
      name: "actlog_tabel_idx",
    });
  },

  async down(queryInterface) {
    const removeIfExists = async (table, name) => {
      const existing = await queryInterface.showIndex(table).catch(() => []);
      if (existing.some((idx) => idx.name === name)) {
        await queryInterface.removeIndex(table, name);
      }
    };

    await removeIfExists("laporan_polisi", "lp_active_tgllp_idx");
    await removeIfExists("laporan_polisi", "lp_active_polres_tgllp_idx");
    await removeIfExists("laporan_polisi", "lp_tgllaka_idx");
    await removeIfExists("laporan_polisi", "lp_nolp_polres_unique");
    await removeIfExists("korban", "korban_lp_active_idx");
    await removeIfExists("kendaraan", "kendaraan_lp_active_idx");
    await removeIfExists("activity_log", "actlog_waktu_idx");
    await removeIfExists("activity_log", "actlog_user_idx");
    await removeIfExists("activity_log", "actlog_tabel_idx");
  },
};
