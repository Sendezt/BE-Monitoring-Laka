// src/routes/activityLog.route.js
const express = require("express");

const { getActivityLogs } = require("../controllers/activityLog.controller");
const { verifyToken, checkRole } = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Activity Log
 *   description: Audit trail semua aksi CUD — hanya admin
 */

/**
 * @swagger
 * /api/activity-log:
 *   get:
 *     summary: Get activity logs (Admin only)
 *     description: Ambil semua activity log dengan filter opsional. Hanya bisa diakses oleh admin.
 *     tags: [Activity Log]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: tabel
 *         schema:
 *           type: string
 *         description: Filter by nama tabel (contoh laporan_polisi)
 *         example: laporan_polisi
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter dari tanggal (waktu >= from)
 *         example: "2026-08-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter sampai tanggal (waktu <= to 23:59:59)
 *         example: "2026-08-16"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Activity log retrieved successfully
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
 *                   example: Activity log retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       aksi:
 *                         type: string
 *                         example: CREATE
 *                       tabel:
 *                         type: string
 *                         example: laporan_polisi
 *                       record_id:
 *                         type: integer
 *                       waktu:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           username:
 *                             type: string
 *                           nama_lengkap:
 *                             type: string
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - hanya admin
 *       500:
 *         description: Failed to retrieve activity log
 */
router.get("/", verifyToken, checkRole(["admin"]), getActivityLogs);

module.exports = router;
