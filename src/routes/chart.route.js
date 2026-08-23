const express = require("express");

const {
    getPerbandinganStatistik,
    getPerbandinganCidera,
    getTotalLakaPerWilayah,
    getTotalKorbanPerWilayah,
    getStatistikKasusTabrak,
    getStatistikKorbanByProfesi,
    getStatistikKorbanByJenisKendaraan,
    getTop20KecamatanLaka,
    getTop10PolresLaka,
    getTrenBulanan,
    getTop15RumahSakitKorban,
    getTrendHarianLPKorban,
    getStatistikHariKejadian,
    getTop10PolresPenerbitanLPTerlama
} = require("../controllers/chart.controller");

const {
    verifyToken,
} = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Chart
 *   description: Endpoint untuk perbandingan statistik kecelakaan antar periode
 */

/**
 * @swagger
 * /api/chart/perbandingan:
 *   get:
 *     summary: Perbandingan statistik kecelakaan antara dua periode
 *     description: Membandingkan total LP dan total korban antara periode utama (rentang tanggal diberikan) dan periode pembanding (mundur 1 bulan). Filter polres_id ALL untuk semua Polres. Pegawai hanya bisa mengakses data di wilayah sendiri.
 *     tags: [Chart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tanggal_awal
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal awal periode utama (format YYYY-MM-DD)
 *         example: "2026-07-02"
 *       - in: query
 *         name: tanggal_akhir
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal akhir periode utama (format YYYY-MM-DD)
 *         example: "2026-08-12"
 *       - in: query
 *         name: polres_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Polres atau "ALL" untuk seluruh Polres
 *         example: "1"
 *     responses:
 *       200:
 *         description: Perbandingan statistik berhasil diambil
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
 *                   example: Perbandingan statistik retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     periode_utama:
 *                       type: object
 *                       properties:
 *                         tanggal_awal:
 *                           type: string
 *                           example: "2026-07-02"
 *                         tanggal_akhir:
 *                           type: string
 *                           example: "2026-08-12"
 *                         total_lp:
 *                           type: integer
 *                           example: 3487
 *                         total_korban:
 *                           type: integer
 *                           example: 4644
 *                     periode_pembanding:
 *                       type: object
 *                       properties:
 *                         tanggal_awal:
 *                           type: string
 *                           example: "2026-06-02"
 *                         tanggal_akhir:
 *                           type: string
 *                           example: "2026-07-12"
 *                         total_lp:
 *                           type: integer
 *                           example: 3200
 *                         total_korban:
 *                           type: integer
 *                           example: 4200
 *                     selisih:
 *                       type: object
 *                       properties:
 *                         selisih_lp:
 *                           type: integer
 *                           example: 287
 *                         selisih_korban:
 *                           type: integer
 *                           example: 444
 *       400:
 *         description: Parameter tidak lengkap atau tanggal tidak valid
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve perbandingan statistik
 */
router.get("/perbandingan", verifyToken, getPerbandinganStatistik);

/**
 * @swagger
 * /api/chart/perbandingan-cidera:
 *   get:
 *     summary: Perbandingan korban per kategori cidera antara dua periode
 *     description: Membandingkan jumlah korban per kategori cidera (LL, LL-MD, MD) antara periode utama dan periode pembanding (mundur 1 bulan).
 *     tags: [Chart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tanggal_awal
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: tanggal_akhir
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: polres_id
 *         schema: { type: string }
 *         description: ID polres atau ALL
 *     responses:
 *       200:
 *         description: Perbandingan cidera retrieved successfully
 */
router.get("/perbandingan-cidera", verifyToken, getPerbandinganCidera);

/**
 * @swagger
 * /api/chart/statistik/total-laka-per-wilayah:
 *   get:
 *     summary: Total laka per wilayah
 *     description: Mendapatkan jumlah total laporan polisi (laka) untuk setiap wilayah. Mendukung filter rentang tanggal (from, to). Pegawai hanya melihat wilayah sendiri.
 *     tags: [Chart]
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
 *     responses:
 *       200:
 *         description: Total laka per wilayah retrieved successfully
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
 *                   example: Total laka per wilayah retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_keseluruhan:
 *                       type: integer
 *                       example: 500
 *                     data_wilayah:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           nama:
 *                             type: string
 *                             example: "Wilayah Barat"
 *                           total_laka:
 *                             type: integer
 *                             example: 120
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve total laka per wilayah
 */
router.get("/statistik/total-laka-per-wilayah", verifyToken, getTotalLakaPerWilayah);

/**
 * @swagger
 * /api/chart/statistik/total-korban-per-wilayah:
 *   get:
 *     summary: Total korban per wilayah
 *     description: Mendapatkan jumlah total korban untuk setiap wilayah. Mendukung filter rentang tanggal (from, to). Pegawai hanya melihat wilayah sendiri.
 *     tags: [Chart]
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
 *     responses:
 *       200:
 *         description: Total korban per wilayah retrieved successfully
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
 *                   example: Total korban per wilayah retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_keseluruhan:
 *                       type: integer
 *                       example: 800
 *                     data_wilayah:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           nama:
 *                             type: string
 *                             example: "Wilayah Barat"
 *                           total_korban:
 *                             type: integer
 *                             example: 180
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve total korban per wilayah
 */
router.get(
    "/statistik/total-korban-per-wilayah",
    verifyToken,
    getTotalKorbanPerWilayah
);

/**
 * @swagger
 * /api/chart/statistik/kasus-tabrak:
 *   get:
 *     summary: Statistik laka berdasarkan tipe kasus tabrak kecelakaan
 *     description: Mendapatkan distribusi jumlah laporan polisi berdasarkan tipe kasus tabrak kecelakaan beserta persentasenya. Mendukung filter rentang tanggal (from, to), Polres, dan Kecamatan. Pegawai hanya melihat wilayah sendiri.
 *     tags: [Chart]
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
 *         description: Statistik kasus tabrak retrieved successfully
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
 *                   example: Statistik kasus tabrak retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_laporan:
 *                       type: integer
 *                       example: 100
 *                     rincian_kasus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           nama:
 *                             type: string
 *                             example: "Tabrak Lari"
 *                           total:
 *                             type: integer
 *                             example: 30
 *                           persentase:
 *                             type: string
 *                             example: "30.00%"
 *                     tanpa_kasus:
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
 *         description: Failed to retrieve statistik kasus tabrak
 */
router.get("/statistik/kasus-tabrak", verifyToken, getStatistikKasusTabrak);

/**
 * @swagger
 * /api/chart/statistik/korban-per-profesi:
 *   get:
 *     summary: Statistik korban berdasarkan profesi
 *     description: Mendapatkan jumlah total korban dan distribusinya berdasarkan profesi beserta persentase. Mendukung filter rentang tanggal, Polres, dan Kecamatan. Pegawai hanya melihat wilayah sendiri.
 *     tags: [Chart]
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
 *         description: Statistik korban berdasarkan profesi retrieved successfully
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
 *                   example: Statistik korban berdasarkan profesi retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_korban:
 *                       type: integer
 *                       example: 200
 *                     rincian_profesi:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           nama:
 *                             type: string
 *                             example: "Pelajar"
 *                           total:
 *                             type: integer
 *                             example: 50
 *                           persentase:
 *                             type: string
 *                             example: "25.00%"
 *                     tanpa_profesi:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 20
 *                         persentase:
 *                           type: string
 *                           example: "10.00%"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve statistik korban berdasarkan profesi
 */
router.get("/statistik/korban-per-profesi", verifyToken, getStatistikKorbanByProfesi);

/**
 * @swagger
 * /api/chart/statistik/korban-per-jenis-kendaraan:
 *   get:
 *     summary: Statistik korban berdasarkan jenis kendaraan
 *     description: Mendapatkan jumlah total korban dan distribusinya berdasarkan jenis kendaraan beserta persentase. Mendukung filter rentang tanggal, Polres, dan Kecamatan. Pegawai hanya melihat wilayah sendiri.
 *     tags: [Chart]
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
 *         description: Statistik korban berdasarkan jenis kendaraan retrieved successfully
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
 *                   example: Statistik korban berdasarkan jenis kendaraan retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_korban:
 *                       type: integer
 *                       example: 200
 *                     rincian_jenis_kendaraan:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           nama:
 *                             type: string
 *                             example: "Sepeda Motor"
 *                           total:
 *                             type: integer
 *                             example: 120
 *                           persentase:
 *                             type: string
 *                             example: "60.00%"
 *                     tanpa_kendaraan:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 20
 *                         persentase:
 *                           type: string
 *                           example: "10.00%"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve statistik korban berdasarkan jenis kendaraan
 */
router.get(
    "/statistik/korban-per-jenis-kendaraan",
    verifyToken,
    getStatistikKorbanByJenisKendaraan
);

/**
 * @swagger
 * /api/chart/statistik/top-20-kecamatan-laka:
 *   get:
 *     summary: Top 20 kecamatan dengan laka tertinggi
 *     description: Mendapatkan 20 kecamatan dengan jumlah laporan polisi (laka) tertinggi. Mendukung filter rentang tanggal (from, to) dan Polres. Pegawai hanya melihat wilayah sendiri.
 *     tags: [Chart]
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
 *           type: string
 *         description: ID Polres atau "ALL" untuk seluruh Polres
 *         example: "ALL"
 *     responses:
 *       200:
 *         description: Top 20 kecamatan laka retrieved successfully
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
 *                   example: Top 20 kecamatan laka retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       kecamatan_id:
 *                         type: integer
 *                         example: 3
 *                       nama_kecamatan:
 *                         type: string
 *                         example: "Kecamatan A"
 *                       total_laka:
 *                         type: integer
 *                         example: 120
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve top 20 kecamatan laka
 */
router.get(
    "/statistik/top-20-kecamatan-laka",
    verifyToken,
    getTop20KecamatanLaka
);

/**
 * @swagger
 * /api/chart/statistik/top-10-polres-laka:
 *   get:
 *     summary: 10 Polres dengan jumlah laka (LP) tertinggi
 *     description: Agregasi jumlah laporan polisi per polres, diurutkan menurun, dibatasi 10. Filter tanggal by tanggal_lp. Pegawai hanya wilayahnya.
 *     tags: [Chart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: polres_id
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Top 10 polres laka retrieved successfully
 */
router.get(
    "/statistik/top-10-polres-laka",
    verifyToken,
    getTop10PolresLaka
);

/**
 * @swagger
 * /api/chart/statistik/tren-bulanan:
 *   get:
 *     summary: Tren jumlah LP per bulan (agregasi DB)
 *     description: Jumlah laporan polisi dikelompokkan per bulan (YYYY-MM) berdasarkan tanggal_lp. Filter opsional from, to, polres_id. Pegawai hanya wilayahnya.
 *     tags: [Chart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: polres_id
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tren bulanan retrieved successfully
 */
router.get(
    "/statistik/tren-bulanan",
    verifyToken,
    getTrenBulanan
);

/**
 * @swagger
 * /api/chart/statistik/top-15-rumah-sakit-korban:
 *   get:
 *     summary: Top 15 rumah sakit dengan korban terbanyak
 *     description: Mendapatkan 15 rumah sakit dengan jumlah korban terbanyak berdasarkan laporan polisi yang memiliki rumah sakit. Mendukung filter rentang tanggal, Polres, dan Kecamatan. Pegawai hanya melihat wilayah sendiri.
 *     tags: [Chart]
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
 *         description: Top 15 rumah sakit korban retrieved successfully
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
 *                   example: Top 15 rumah sakit korban retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rumah_sakit_id:
 *                         type: integer
 *                         example: 5
 *                       nama_rumah_sakit:
 *                         type: string
 *                         example: "RSUD Dr. Moewardi"
 *                       total_korban:
 *                         type: integer
 *                         example: 85
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve top 15 rumah sakit korban
 */
router.get(
    "/statistik/top-15-rumah-sakit-korban",
    verifyToken,
    getTop15RumahSakitKorban
);

/**
 * @swagger
 * /api/chart/statistik/trend-harian:
 *   get:
 *     summary: Trend harian LP dan Korban
 *     description: Mendapatkan data trend harian Laporan Polisi (LP) dan Korban untuk periode utama dan periode pembanding (mundur 1 bulan). Setiap tanggal pada periode utama dipasangkan dengan tanggal yang sama pada periode pembanding.
 *     tags: [Chart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tanggal_awal
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal awal periode utama (format YYYY-MM-DD)
 *         example: "2026-08-01"
 *       - in: query
 *         name: tanggal_akhir
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal akhir periode utama (format YYYY-MM-DD)
 *         example: "2026-08-11"
 *       - in: query
 *         name: polres_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Polres atau "ALL" untuk seluruh Polres
 *         example: "1"
 *     responses:
 *       200:
 *         description: Data trend LP dan korban berhasil diambil
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
 *                   example: Data trend LP dan korban berhasil diambil
 *                 data:
 *                   type: object
 *                   properties:
 *                     periode_utama:
 *                       type: object
 *                       properties:
 *                         tanggal_awal:
 *                           type: string
 *                           example: "2026-08-01"
 *                         tanggal_akhir:
 *                           type: string
 *                           example: "2026-08-11"
 *                     periode_pembanding:
 *                       type: object
 *                       properties:
 *                         tanggal_awal:
 *                           type: string
 *                           example: "2026-07-01"
 *                         tanggal_akhir:
 *                           type: string
 *                           example: "2026-07-11"
 *                     trend:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tanggal:
 *                             type: string
 *                             example: "01"
 *                           lp_periode_utama:
 *                             type: integer
 *                             example: 106
 *                           korban_periode_utama:
 *                             type: integer
 *                             example: 131
 *                           lp_periode_pembanding:
 *                             type: integer
 *                             example: 144
 *                           korban_periode_pembanding:
 *                             type: integer
 *                             example: 192
 *       400:
 *         description: Parameter tidak lengkap atau tanggal tidak valid
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve trend harian LP korban
 */
router.get("/statistik/trend-harian", verifyToken, getTrendHarianLPKorban);

/**
 * @swagger
 * /api/chart/statistik/hari-kejadian:
 *   get:
 *     summary: Statistik laka berdasarkan hari kejadian
 *     description: Mendapatkan jumlah total laporan polisi berdasarkan hari kejadian. Mendukung filter rentang tanggal, Polres, dan Kecamatan. Pegawai hanya melihat wilayah sendiri.
 *     tags: [Chart]
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
 *         description: Statistik hari kejadian laka retrieved successfully
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
 *                   example: Statistik hari kejadian laka retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       hari:
 *                         type: string
 *                         example: "SENIN"
 *                       total_laka:
 *                         type: integer
 *                         example: 6
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve statistik hari kejadian laka
 */
router.get("/statistik/hari-kejadian", verifyToken, getStatistikHariKejadian);

/**
 * @swagger
 * /api/chart/statistik/top-10-polres-lp-terlama:
 *   get:
 *     summary: 10 Polres dengan penerbitan LP terlama
 *     description: Mendapatkan daftar 10 Polres yang memiliki rata-rata waktu penerbitan Laporan Polisi terlama (berdasarkan kolom telat_lp). Mendukung filter rentang tanggal. Pegawai hanya melihat wilayah sendiri.
 *     tags: [Chart]
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
 *           type: string
 *         description: ID Polres atau "ALL"
 *         example: "ALL"
 *     responses:
 *       200:
 *         description: Top 10 Polres LP terlama retrieved successfully
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
 *                   example: Top 10 Polres LP terlama retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       polres_id:
 *                         type: integer
 *                         example: 5
 *                       nama_polres:
 *                         type: string
 *                         example: "POLRESTA BANYUMAS"
 *                       rata_rata_telat:
 *                         type: string
 *                         example: "63.43"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve top 10 Polres LP terlama
 */
router.get("/statistik/top-10-polres-lp-terlama", verifyToken, getTop10PolresPenerbitanLPTerlama);

module.exports = router;