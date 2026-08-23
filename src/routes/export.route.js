const express = require("express");

const {
    exportLaporanPolisi,
    exportMonitoring,
    exportRekapitulasi,
} = require("../controllers/export.controller");

const { verifyToken } = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Export
 *   description: Export data ke Excel (XLSX)
 */

/**
 * @swagger
 * /api/export/laporan-polisi:
 *   get:
 *     summary: Export daftar laporan polisi ke Excel
 *     tags: [Export]
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
 *         description: File XLSX
 */
router.get("/laporan-polisi", verifyToken, exportLaporanPolisi);

/**
 * @swagger
 * /api/export/monitoring:
 *   get:
 *     summary: Export monitoring data (spreadsheet per korban) ke Excel
 *     tags: [Export]
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
 *         description: File XLSX
 */
router.get("/monitoring", verifyToken, exportMonitoring);

/**
 * @swagger
 * /api/export/rekapitulasi:
 *   get:
 *     summary: Export rekapitulasi (per Polres & per Loket) ke Excel
 *     tags: [Export]
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
 *         description: File XLSX (2 sheet)
 */
router.get("/rekapitulasi", verifyToken, exportRekapitulasi);

module.exports = router;
