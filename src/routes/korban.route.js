const express = require("express");

const {
    getKorban,
    getKorbanById,
    createKorban,
    updateKorban,
    deleteKorban,
} = require("../controllers/korban.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Korban
 *   description: Korban (Victim) management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Korban:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         laporan_polisi_id:
 *           type: integer
 *           example: 1
 *         nama:
 *           type: string
 *           example: "Budi Santoso"
 *         usia:
 *           type: integer
 *           example: 25
 *         profesi_id:
 *           type: integer
 *           nullable: true
 *           example: 2
 *         cidera_id:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         kendaraan_id:
 *           type: integer
 *           nullable: true
 *           example: 1
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
 *     KorbanRequest:
 *       type: object
 *       required:
 *         - laporan_polisi_id
 *         - nama
 *         - usia
 *       properties:
 *         laporan_polisi_id:
 *           type: integer
 *           example: 1
 *         nama:
 *           type: string
 *           example: "Budi Santoso"
 *         usia:
 *           type: integer
 *           example: 25
 *         profesi_id:
 *           type: integer
 *           nullable: true
 *           example: 2
 *         cidera_id:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         kendaraan_id:
 *           type: integer
 *           nullable: true
 *           example: 1
 */

/**
 * @swagger
 * /api/korban:
 *   get:
 *     summary: Get all korban
 *     description: Retrieve a list of all active korban, ordered by ID descending, including associated details.
 *     tags: [Korban]
 *     responses:
 *       200:
 *         description: Korban retrieved successfully
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
 *                   example: Korban retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Korban'
 *       500:
 *         description: Failed to retrieve korban
 */
router.get("/", getKorban);

/**
 * @swagger
 * /api/korban/{id}:
 *   get:
 *     summary: Get korban by ID
 *     description: Retrieve a single korban by its ID. Returns 404 if not found or inactive.
 *     tags: [Korban]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The korban ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Korban retrieved successfully
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
 *                   example: Korban retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Korban'
 *       404:
 *         description: Korban not found
 *       500:
 *         description: Failed to retrieve korban
 */
router.get("/:id", getKorbanById);

/**
 * @swagger
 * /api/korban:
 *   post:
 *     summary: Create a new korban
 *     description: Create a new korban record. Validates associations and ensures the kendaraan belongs to the same LP with a 'korban' peran.
 *     tags: [Korban]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KorbanRequest'
 *     responses:
 *       201:
 *         description: Korban created successfully
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
 *                   example: Korban created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Korban'
 *       400:
 *         description: Invalid inputs or mismatched association properties
 *       404:
 *         description: Associated resource (Laporan Polisi, Profesi, Cidera, Kendaraan) not found
 *       500:
 *         description: Failed to create korban
 */
router.post("/", createKorban);

/**
 * @swagger
 * /api/korban/{id}:
 *   put:
 *     summary: Update a korban
 *     description: Update an existing korban by ID. Performs validation on updated associations.
 *     tags: [Korban]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The korban ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KorbanRequest'
 *     responses:
 *       200:
 *         description: Korban updated successfully
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
 *                   example: Korban updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Korban'
 *       400:
 *         description: Invalid inputs or mismatched association properties
 *       404:
 *         description: Korban or associated resource not found
 *       500:
 *         description: Failed to update korban
 */
router.put("/:id", updateKorban);

/**
 * @swagger
 * /api/korban/{id}:
 *   delete:
 *     summary: Delete a korban
 *     description: Soft-delete a korban by setting is_active to false. Returns 404 if not found or already inactive.
 *     tags: [Korban]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The korban ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Korban deleted successfully
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
 *                   example: Korban deleted successfully
 *                 data:
 *                   type: "null"
 *                   example: null
 *       404:
 *         description: Korban not found
 *       500:
 *         description: Failed to delete korban
 */
router.delete("/:id", deleteKorban);

module.exports = router;