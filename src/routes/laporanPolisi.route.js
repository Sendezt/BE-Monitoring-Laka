const express = require("express");

const {
    getLaporanPolisi,
    getLaporanPolisiById,
    createLaporanPolisi,
    updateLaporanPolisi,
    deleteLaporanPolisi,
    getStatistikKomparasi,
} = require("../controllers/laporanPolisi.controller");

const {
    verifyToken,
    checkRole,
} = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Laporan Polisi
 *   description: Laporan Polisi (Police Report) management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LaporanPolisi:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         no_lp:
 *           type: string
 *           example: "LP/123/VIII/2026"
 *         tanggal_laka:
 *           type: string
 *           format: date
 *           example: "2026-08-15"
 *         hari_kejadian:
 *           type: string
 *           example: "Sabtu"
 *         tanggal_lp:
 *           type: string
 *           format: date
 *           example: "2026-08-16"
 *         telat_lp:
 *           type: integer
 *           example: 1
 *         kecamatan_id:
 *           type: integer
 *           example: 1
 *         kelurahan_id:
 *           type: integer
 *           example: 2
 *         lokasi_laka:
 *           type: string
 *           example: "Jl. Slamet Riyadi No. 10"
 *         rumah_sakit_id:
 *           type: integer
 *           nullable: true
 *           example: 3
 *         rumah_sakit_wilayah:
 *           type: string
 *           nullable: true
 *           example: "RSUD Dr. Moewardi"
 *         laka_tunggal:
 *           type: boolean
 *           example: false
 *         tindak_lanjut_id:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         jenis_jaminan_id:
 *           type: integer
 *           nullable: true
 *           example: 2
 *         keterjaminan_id:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         kasus_tabrak_kecelakaan_id:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         faktor_penyebab_laka_id:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         sifat_laka_id:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         keterangan:
 *           type: string
 *           nullable: true
 *           example: "Kecelakaan melibatkan dua sepeda motor."
 *         is_active:
 *           type: boolean
 *           example: true
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2026-08-16T10:00:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2026-08-16T10:00:00.000Z"
 *     LaporanPolisiRequest:
 *       type: object
 *       required:
 *         - no_lp
 *         - tanggal_laka
 *         - hari_kejadian
 *         - tanggal_lp
 *         - kecamatan_id
 *         - kelurahan_id
 *         - lokasi_laka
 *       properties:
 *         no_lp:
 *           type: string
 *           example: "LP/123/VIII/2026"
 *         tanggal_laka:
 *           type: string
 *           format: date
 *           example: "2026-08-15"
 *         hari_kejadian:
 *           type: string
 *           example: "Sabtu"
 *         tanggal_lp:
 *           type: string
 *           format: date
 *           example: "2026-08-16"
 *         telat_lp:
 *           type: integer
 *           example: 1
 *         kecamatan_id:
 *           type: integer
 *           example: 1
 *         kelurahan_id:
 *           type: integer
 *           example: 2
 *         lokasi_laka:
 *           type: string
 *           example: "Jl. Slamet Riyadi No. 10"
 *         rumah_sakit_id:
 *           type: integer
 *           nullable: true
 *           example: 3
 *         rumah_sakit_wilayah:
 *           type: string
 *           nullable: true
 *           example: "RSUD Dr. Moewardi"
 *         laka_tunggal:
 *           type: boolean
 *           example: false
 *         tindak_lanjut_id:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         jenis_jaminan_id:
 *           type: integer
 *           nullable: true
 *           example: 2
 *         keterjaminan_id:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         kasus_tabrak_kecelakaan_id:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         faktor_penyebab_laka_id:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         sifat_laka_id:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         keterangan:
 *           type: string
 *           nullable: true
 *           example: "Kecelakaan melibatkan dua sepeda motor."
 */

/**
 * @swagger
 * /api/laporan-polisi:
 *   get:
 *     summary: Get all laporan polisi
 *     description: Retrieve a list of all active laporan polisi, ordered by tanggal_laka descending.
 *     tags: [Laporan Polisi]
 *     responses:
 *       200:
 *         description: Laporan polisi retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Laporan polisi retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LaporanPolisi'
 *       401:
 *         description: Unauthorized - Token diperlukan
 *       500:
 *         description: Failed to retrieve laporan polisi
 */
router.get("/", verifyToken, getLaporanPolisi);

/**
 * @swagger
 * /api/laporan-polisi/statistik/komparasi:
 *   get:
 *     summary: Komparasi statistik 2 periode
 *     description: Bandingkan jumlah laka, korban, dan laka tunggal antara 2 rentang tanggal berbeda.
 *     tags: [Laporan Polisi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start1
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-07-01"
 *       - in: query
 *         name: end1
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-07-31"
 *       - in: query
 *         name: start2
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-08-01"
 *       - in: query
 *         name: end2
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-08-16"
 *     responses:
 *       200:
 *         description: Statistik komparasi berhasil diambil
 *       400:
 *         description: Parameter tidak lengkap
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve statistik komparasi
 */
router.get("/statistik/komparasi", verifyToken, getStatistikKomparasi);

/**
 * @swagger
 * /api/laporan-polisi/{id}:
 *   get:
 *     summary: Get laporan polisi by ID
 *     description: Retrieve a single laporan polisi by its ID with nested kendaraan & korban. Returns 404 if not found or inactive. Pegawai hanya bisa akses laporan di wilayah sendiri.
 *     tags: [Laporan Polisi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The laporan polisi ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Laporan polisi retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Laporan polisi retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/LaporanPolisi'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - beda wilayah
 *       404:
 *         description: Laporan polisi not found
 *       500:
 *         description: Failed to retrieve laporan polisi
 */
router.get("/:id", verifyToken, getLaporanPolisiById);

/**
 * @swagger
 * /api/laporan-polisi:
 *   post:
 *     summary: Create laporan polisi (All-in-One)
 *     description: Buat laporan polisi beserta data kendaraan dan korban dalam 1 request transaksional. Jika ada error, seluruh data di-rollback.
 *     tags: [Laporan Polisi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LaporanPolisiRequest'
 *     responses:
 *       201:
 *         description: Laporan polisi, kendaraan, dan korban created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Laporan polisi, kendaraan, dan korban created successfully
 *                 data:
 *                   $ref: '#/components/schemas/LaporanPolisi'
 *       400:
 *         description: Required fields are missing
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to create laporan polisi
 */
router.post("/", verifyToken, createLaporanPolisi);

/**
 * @swagger
 * /api/laporan-polisi/{id}:
 *   put:
 *     summary: Update a laporan polisi
 *     description: Update laporan polisi by ID. Pegawai hanya bisa update laporan di wilayah sendiri.
 *     tags: [Laporan Polisi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The laporan polisi ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LaporanPolisiRequest'
 *     responses:
 *       200:
 *         description: Laporan polisi updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - beda wilayah
 *       404:
 *         description: Laporan polisi not found
 *       500:
 *         description: Failed to update laporan polisi
 */
router.put("/:id", verifyToken, updateLaporanPolisi);

/**
 * @swagger
 * /api/laporan-polisi/{id}:
 *   delete:
 *     summary: Delete a laporan polisi (Admin only)
 *     description: Soft-delete laporan + cascade ke kendaraan & korban dalam 1 transaksi. Hanya admin yang bisa menghapus.
 *     tags: [Laporan Polisi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The laporan polisi ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Laporan polisi deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - hanya admin
 *       404:
 *         description: Laporan polisi not found
 *       500:
 *         description: Failed to delete laporan polisi
 */
router.delete("/:id", verifyToken, checkRole(["admin"]), deleteLaporanPolisi);

module.exports = router;