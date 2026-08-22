const express = require("express");

const {
    getLaporanPolisi,
    getLaporanPolisiById,
    createLaporanPolisi,
    updateLaporanPolisi,
    deleteLaporanPolisi,
    getStatistikKomparasi,
    getStatusLP,
    getBreakdownTerlambat,
    getStatistikJenisLaka,
    getStatistikKorban,
    getStatistikKeterjaminan,
    getRekapitulasiPolres,
    getRekapitulasiLoket
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
 *         polres_id:
 *           type: integer
 *           description: FK ke tabel polres
 *           example: 1
 *         polres:
 *           type: object
 *           description: Relasi polres (included on GET responses)
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             nama:
 *               type: string
 *               example: "Polres Banyumas"
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
 *         - polres_id
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
 *         polres_id:
 *           type: integer
 *           description: ID polres yang menangani laporan polisi
 *           example: 1
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
 *         kendaraan:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               peran:
 *                 type: string
 *                 enum: [korban, penjamin]
 *                 example: korban
 *               jenis_kendaraan_id:
 *                 type: integer
 *                 example: 1
 *               nopol:
 *                 type: string
 *                 example: "R 1234 AB"
 *               masa_laku_sw:
 *                 type: string
 *                 format: date
 *                 example: "2026-08-15"
 *         korban:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               nama:
 *                 type: string
 *                 example: "Budi Santoso"
 *               usia:
 *                 type: integer
 *                 example: 35
 *               profesi_id:
 *                 type: integer
 *                 example: 3
 *               cidera_id:
 *                 type: integer
 *                 example: 2
 *               kendaraan_index:
 *                 type: integer
 *                 description: Index kendaraan di array kendaraan (0, 1, 2, dst)
 *                 example: 0
 *               tindak_lanjut_id:
 *                 type: integer
 *                 example: 1
 *               jenis_jaminan_id:
 *                 type: integer
 *                 example: 2
 *               keterjaminan_id:
 *                 type: integer
 *                 example: 1
 */

/**
 * @swagger
 * /api/laporan-polisi:
 *   get:
 *     summary: Get all laporan polisi
 *     description: Retrieve a list of all active laporan polisi, ordered by tanggal_laka descending.
 *     tags: [Laporan Polisi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tanggal_laka dari (>=)
 *         example: "2026-08-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tanggal_laka sampai (<=)
 *         example: "2026-08-31"
 *       - in: query
 *         name: no_lp
 *         schema:
 *           type: string
 *         description: Filter by nomor LP (partial match)
 *         example: "LP/123"
 *       - in: query
 *         name: kecamatan_id
 *         schema:
 *           type: integer
 *         description: Filter by kecamatan ID
 *         example: 1
 *       - in: query
 *         name: polres_id
 *         schema:
 *           type: integer
 *         description: Filter by polres ID
 *         example: 1
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page (max 100)
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
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total_pages:
 *                       type: integer
 *                       example: 5
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
 * /api/laporan-polisi/status-lp:
 *   get:
 *     summary: Get status LP (terlambat & normal)
 *     description: Retrieve the total count of active laporan polisi terlambat (telat_lp > 0) and normal (telat_lp = 0), optionally filtered by date range, polres, or kecamatan. Pegawai hanya bisa akses wilayah sendiri.
 *     tags: [Laporan Polisi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tanggal_laka dari (>=)
 *         example: "2026-08-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tanggal_laka sampai (<=)
 *         example: "2026-08-31"
 *       - in: query
 *         name: polres_id
 *         schema:
 *           type: integer
 *         description: Filter by polres ID
 *         example: 1
 *       - in: query
 *         name: kecamatan_id
 *         schema:
 *           type: integer
 *         description: Filter by kecamatan ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Status LP retrieved successfully
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
 *                   example: Status LP retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_terlambat:
 *                       type: integer
 *                       example: 5
 *                     total_normal:
 *                       type: integer
 *                       example: 25
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve status LP
 */
router.get("/status-lp", verifyToken, getStatusLP);

/**
 * @swagger
 * /api/laporan-polisi/breakdown-terlambat:
 *   get:
 *     summary: Get breakdown laporan polisi terlambat
 *     description: Retrieve the breakdown of active laporan polisi with telat_lp > 0 (1-3 days, 4-7 days, and >7 days) with their counts and percentages. Pegawai hanya bisa akses wilayah sendiri.
 *     tags: [Laporan Polisi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tanggal_laka dari (>=)
 *         example: "2026-08-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tanggal_laka sampai (<=)
 *         example: "2026-08-31"
 *       - in: query
 *         name: polres_id
 *         schema:
 *           type: integer
 *         description: Filter by polres ID
 *         example: 1
 *       - in: query
 *         name: kecamatan_id
 *         schema:
 *           type: integer
 *         description: Filter by kecamatan ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Breakdown terlambat retrieved successfully
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
 *                   example: Breakdown terlambat retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_terlambat:
 *                       type: integer
 *                       example: 10
 *                     terlambat_1_3_hari:
 *                       type: integer
 *                       example: 5
 *                     persentase_1_3_hari:
 *                       type: string
 *                       example: "50.00%"
 *                     terlambat_4_7_hari:
 *                       type: integer
 *                       example: 3
 *                     persentase_4_7_hari:
 *                       type: string
 *                       example: "30.00%"
 *                     terlambat_lebih_7_hari:
 *                       type: integer
 *                       example: 2
 *                     persentase_lebih_7_hari:
 *                       type: string
 *                       example: "20.00%"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve breakdown terlambat
 */
router.get("/breakdown-terlambat", verifyToken, getBreakdownTerlambat);

/**
 * @swagger
 * /api/laporan-polisi/statistik/jenis-laka:
 *   get:
 *     summary: Statistik kecelakaan tunggal dan non-tunggal
 *     description: Mengambil jumlah dan persentase kecelakaan tunggal dan non-tunggal berdasarkan field laka_tunggal. Pegawai hanya bisa mengakses data di wilayah sendiri.
 *     tags: [Laporan Polisi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tanggal_laka dari (>=)
 *         example: "2026-08-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tanggal_laka sampai (<=)
 *         example: "2026-08-31"
 *       - in: query
 *         name: polres_id
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan Polres
 *         example: 1
 *       - in: query
 *         name: kecamatan_id
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan Kecamatan
 *         example: 1
 *     responses:
 *       200:
 *         description: Statistik jenis laka berhasil diambil
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
 *                   example: Statistik jenis laka retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_laka:
 *                       type: integer
 *                       example: 30
 *                     laka_tunggal:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 12
 *                         persentase:
 *                           type: string
 *                           example: "40.00%"
 *                     laka_non_tunggal:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 18
 *                         persentase:
 *                           type: string
 *                           example: "60.00%"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve statistik jenis laka
 */
router.get(
    "/statistik/jenis-laka",
    verifyToken,
    getStatistikJenisLaka
);

/**
 * @swagger
 * /api/laporan-polisi/statistik/korban:
 *   get:
 *     summary: Statistik korban berdasarkan cidera
 *     description: Mendapatkan total korban dan breakdown berdasarkan kategori cidera (LL, LL-MD, MD) beserta persentasenya. Pegawai hanya bisa mengakses data di wilayah sendiri.
 *     tags: [Laporan Polisi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tanggal_laka dari (>=)
 *         example: "2026-08-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tanggal_laka sampai (<=)
 *         example: "2026-08-31"
 *       - in: query
 *         name: polres_id
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan Polres
 *         example: 1
 *       - in: query
 *         name: kecamatan_id
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan Kecamatan
 *         example: 1
 *     responses:
 *       200:
 *         description: Statistik korban berhasil diambil
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
 *                   example: Statistik korban retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_korban:
 *                       type: integer
 *                       example: 50
 *                     cidera_LL:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 20
 *                         persentase:
 *                           type: string
 *                           example: "40.00%"
 *                     cidera_LL_MD:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 15
 *                         persentase:
 *                           type: string
 *                           example: "30.00%"
 *                     cidera_MD:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 5
 *                         persentase:
 *                           type: string
 *                           example: "10.00%"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve statistik korban
 */
router.get("/statistik/korban", verifyToken, getStatistikKorban);

/**
 * @swagger
 * /api/laporan-polisi/statistik/keterjaminan:
 *   get:
 *     summary: Statistik keterjaminan laporan polisi
 *     description: Mendapatkan distribusi jumlah laporan polisi berdasarkan jenis keterjaminan beserta persentasenya. Pegawai hanya bisa mengakses data di wilayah sendiri.
 *     tags: [Laporan Polisi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tanggal_laka dari (>=)
 *         example: "2026-08-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tanggal_laka sampai (<=)
 *         example: "2026-08-31"
 *       - in: query
 *         name: polres_id
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan Polres
 *         example: 1
 *       - in: query
 *         name: kecamatan_id
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan Kecamatan
 *         example: 1
 *     responses:
 *       200:
 *         description: Statistik keterjaminan berhasil diambil
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
 *                   example: Statistik keterjaminan retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_laporan:
 *                       type: integer
 *                       example: 100
 *                     rincian_keterjaminan:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           nama:
 *                             type: string
 *                             example: "Jaminan Sendiri"
 *                           total:
 *                             type: integer
 *                             example: 30
 *                           persentase:
 *                             type: string
 *                             example: "30.00%"
 *                     tanpa_keterjaminan:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 20
 *                         persentase:
 *                           type: string
 *                           example: "20.00%"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve statistik keterjaminan
 */
router.get("/statistik/keterjaminan", verifyToken, getStatistikKeterjaminan);

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
router.get("/rekapitulasi/polres", verifyToken, getRekapitulasiPolres);
router.get("/rekapitulasi/loket", verifyToken, getRekapitulasiLoket);

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
