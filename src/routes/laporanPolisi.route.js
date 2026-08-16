const express = require("express");

const {
    getLaporanPolisi,
    getLaporanPolisiById,
    createLaporanPolisi,
    updateLaporanPolisi,
    deleteLaporanPolisi,
} = require("../controllers/laporanPolisi.controller");

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
 *       500:
 *         description: Failed to retrieve laporan polisi
 */
router.get("/", getLaporanPolisi);

/**
 * @swagger
 * /api/laporan-polisi/{id}:
 *   get:
 *     summary: Get laporan polisi by ID
 *     description: Retrieve a single laporan polisi by its ID. Returns 404 if not found or inactive.
 *     tags: [Laporan Polisi]
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
 *       404:
 *         description: Laporan polisi not found
 *       500:
 *         description: Failed to retrieve laporan polisi
 */
router.get("/:id", getLaporanPolisiById);

/**
 * @swagger
 * /api/laporan-polisi:
 *   post:
 *     summary: Create a new laporan polisi
 *     description: Create a new laporan polisi record. Returns 409 if a laporan polisi with the same no_lp already exists.
 *     tags: [Laporan Polisi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LaporanPolisiRequest'
 *     responses:
 *       201:
 *         description: Laporan polisi created successfully
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
 *                   example: Laporan polisi created successfully
 *                 data:
 *                   $ref: '#/components/schemas/LaporanPolisi'
 *       400:
 *         description: Required fields are missing
 *       409:
 *         description: Nomor LP already exists
 *       500:
 *         description: Failed to create laporan polisi
 */
router.post("/", createLaporanPolisi);

/**
 * @swagger
 * /api/laporan-polisi/{id}:
 *   put:
 *     summary: Update a laporan polisi
 *     description: Update an existing laporan polisi by ID. Returns 404 if not found, 409 if the new no_lp conflicts with another laporan polisi.
 *     tags: [Laporan Polisi]
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
 *                   example: Laporan polisi updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/LaporanPolisi'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Laporan polisi not found
 *       409:
 *         description: Nomor LP already exists
 *       500:
 *         description: Failed to update laporan polisi
 */
router.put("/:id", updateLaporanPolisi);

/**
 * @swagger
 * /api/laporan-polisi/{id}:
 *   delete:
 *     summary: Delete a laporan polisi
 *     description: Soft-delete a laporan polisi by setting is_active to false. Returns 404 if not found or already inactive.
 *     tags: [Laporan Polisi]
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
 *                   example: Laporan polisi deleted successfully
 *                 data:
 *                   type: "null"
 *                   example: null
 *       404:
 *         description: Laporan polisi not found
 *       500:
 *         description: Failed to delete laporan polisi
 */
router.delete("/:id", deleteLaporanPolisi);

module.exports = router;