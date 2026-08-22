const express = require("express");

const {
    getSheetData,
    checkRow,
    importRow,
} = require("../controllers/migrasi.controller");

const { verifyToken, checkRole } = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Migrasi
 *   description: Migrasi data dari Google Spreadsheet ke database
 */

/**
 * @swagger
 * /api/migrasi/sheets:
 *   get:
 *     summary: Ambil & validasi data dari Google Sheets
 *     description: Membaca satu tab (sheet) dari spreadsheet, mengelompokkan per No LP, mencocokkan dengan data master, lalu menandai status tiap baris (VALID, INVALID_MASTER, DUPLICATE).
 *     tags: [Migrasi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sheet
 *         schema:
 *           type: string
 *           default: "1"
 *         description: Nama tab / sheet (contoh "1" sampai "35")
 *       - in: query
 *         name: startRow
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Baris awal pembacaan
 *       - in: query
 *         name: endRow
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Baris akhir pembacaan
 *     responses:
 *       200:
 *         description: Data sheet berhasil diambil
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Gagal mengambil data dari Google Sheets
 */
router.get("/sheets", verifyToken, checkRole(["admin"]), getSheetData);

/**
 * @swagger
 * /api/migrasi/check:
 *   post:
 *     summary: Cek kesiapan sebuah baris untuk di-insert
 *     description: Memvalidasi kelengkapan field wajib dan memeriksa apakah No LP sudah ada di database.
 *     tags: [Migrasi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payload:
 *                 type: object
 *     responses:
 *       200:
 *         description: Hasil pengecekan baris
 *       400:
 *         description: payload tidak valid
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Gagal memeriksa baris
 */
router.post("/check", verifyToken, checkRole(["admin"]), checkRow);

/**
 * @swagger
 * /api/migrasi/import:
 *   post:
 *     summary: Import 1 baris (grouped per No LP) ke database
 *     description: Menyimpan laporan polisi beserta kendaraan & korban dalam 1 transaksi. Menolak jika field wajib kosong atau No LP sudah ada.
 *     tags: [Migrasi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payload:
 *                 type: object
 *     responses:
 *       201:
 *         description: Baris berhasil diimpor
 *       400:
 *         description: Data tidak lengkap
 *       409:
 *         description: No LP sudah ada di database
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Gagal mengimpor baris
 */
router.post("/import", verifyToken, checkRole(["admin"]), importRow);

module.exports = router;
