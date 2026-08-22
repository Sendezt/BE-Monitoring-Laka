"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1. Pastikan wilayah id 1 ada (Loket Wilayah Jawa Tengah)
    const [wilayahRows] = await queryInterface.sequelize.query(
      "SELECT id FROM wilayah WHERE id = 1"
    );
    if (wilayahRows.length === 0) {
      await queryInterface.bulkInsert("wilayah", [
        {
          id: 1,
          nama: "Loket Kantor Wilayah Jawa Tengah",
          is_active: true,
        },
      ]);
    }

    // 2. Seed user admin & superadmin (lewati jika username sudah ada)
    const [userRows] = await queryInterface.sequelize.query(
      "SELECT username FROM users WHERE username IN ('loketjateng', 'superadmin')"
    );
    const existing = userRows.map((u) => u.username);

    const toInsert = [];

    if (!existing.includes("loketjateng")) {
      toInsert.push({
        username: "loketjateng",
        nama_lengkap: "Loket Kantor Wilayah Jateng",
        password: "$2a$10$p6/6CCkgiaKYQQqiaeiKbORY4LzqR0V6sJfCVK4FNJn3mFdr11Dqu",
        role: "admin",
        wilayah_id: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    if (!existing.includes("superadmin")) {
      toInsert.push({
        username: "superadmin",
        nama_lengkap: "Superadmin",
        password: "$2a$10$Yf7/2thvvlsBxYcAiccSjuYiAEcTIMA.E.JPYAKxu6G1Ov0IdX2T.",
        role: "admin",
        wilayah_id: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert("users", toInsert);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", {
      username: ["loketjateng", "superadmin"],
    });
    // wilayah id 1 tidak dihapus otomatis karena mungkin dipakai data lain.
  },
};
