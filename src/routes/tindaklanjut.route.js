const express = require("express");

const {
    getTindakLanjut,
    getTindakLanjutById,
    createTindakLanjut,
    updateTindakLanjut,
    deleteTindakLanjut,
} = require("../controllers/tindaklanjut.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: TindakLanjut
 *   description: Tindak Lanjut (Follow up) management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TindakLanjut:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nama:
 *           type: string
 *           example: Rawat Jalan
 *         is_active:
 *           type: boolean
 *           example: true
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2026-08-15T10:00:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2026-08-15T10:00:00.000Z"
 *     TindakLanjutRequest:
 *       type: object
 *       required:
 *         - nama
 *       properties:
 *         nama:
 *           type: string
 *           example: Rawat Jalan
 */

/**
 * @swagger
 * /api/tindak-lanjut:
 *   get:
 *     summary: Get all tidak lanjut
 *     description: Retrieve a list of all active tidak lanjut, ordered by name ascending.
 *     tags: [TindakLanjut]
 *     responses:
 *       200:
 *         description: Tidak lanjut retrieved successfully
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
 *                   example: Tidak lanjut retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TindakLanjut'
 *       500:
 *         description: Failed to retrieve tidak lanjut
 */
router.get("/", getTindakLanjut);

/**
 * @swagger
 * /api/tindak-lanjut/{id}:
 *   get:
 *     summary: Get tidak lanjut by ID
 *     description: Retrieve a single tidak lanjut by its ID. Returns 404 if not found or inactive.
 *     tags: [TindakLanjut]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The tidak lanjut ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Tidak lanjut retrieved successfully
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
 *                   example: Tidak lanjut retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/TindakLanjut'
 *       404:
 *         description: Tidak lanjut not found
 *       500:
 *         description: Failed to retrieve tidak lanjut
 */
router.get("/:id", getTindakLanjutById);

/**
 * @swagger
 * /api/tindak-lanjut:
 *   post:
 *     summary: Create a new tidak lanjut
 *     description: Create a new tidak lanjut option. Returns 409 if a tidak lanjut with the same name already exists.
 *     tags: [TindakLanjut]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TindakLanjutRequest'
 *     responses:
 *       201:
 *         description: Tidak lanjut created successfully
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
 *                   example: Tidak lanjut created successfully
 *                 data:
 *                   $ref: '#/components/schemas/TindakLanjut'
 *       400:
 *         description: Nama is required
 *       409:
 *         description: Tidak lanjut already exists
 *       500:
 *         description: Failed to create tidak lanjut
 */
router.post("/", createTindakLanjut);

/**
 * @swagger
 * /api/tindak-lanjut/{id}:
 *   put:
 *     summary: Update a tidak lanjut
 *     description: Update an existing tidak lanjut by ID. Returns 404 if not found, 409 if the new name conflicts with another tidak lanjut.
 *     tags: [TindakLanjut]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The tidak lanjut ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TindakLanjutRequest'
 *     responses:
 *       200:
 *         description: Tidak lanjut updated successfully
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
 *                   example: Tidak lanjut updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/TindakLanjut'
 *       400:
 *         description: Nama is required
 *       404:
 *         description: Tidak lanjut not found
 *       409:
 *         description: Tidak lanjut already exists
 *       500:
 *         description: Failed to update tidak lanjut
 */
router.put("/:id", updateTindakLanjut);

/**
 * @swagger
 * /api/tindak-lanjut/{id}:
 *   delete:
 *     summary: Delete a tidak lanjut
 *     description: Soft-delete a tidak lanjut by setting is_active to false. Returns 404 if not found or already inactive.
 *     tags: [TindakLanjut]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The tidak lanjut ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Tidak lanjut deleted successfully
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
 *                   example: Tidak lanjut deleted successfully
 *                 data:
 *                   type: "null"
 *                   example: null
 *       404:
 *         description: Tidak lanjut not found
 *       500:
 *         description: Failed to delete tidak lanjut
 */
router.delete("/:id", deleteTindakLanjut);

module.exports = router;