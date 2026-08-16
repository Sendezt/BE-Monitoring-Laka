const express = require("express");

const {
    getJenisJaminan,
    getJenisJaminanById,
    createJenisJaminan,
    updateJenisJaminan,
    deleteJenisJaminan,
} = require("../controllers/jenisJaminan.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Jenis Jaminan
 *   description: Jenis Jaminan (Guarantee Type) management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     JenisJaminan:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nama:
 *           type: string
 *           example: Jasa Raharja
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
 *     JenisJaminanRequest:
 *       type: object
 *       required:
 *         - nama
 *       properties:
 *         nama:
 *           type: string
 *           example: Jasa Raharja
 */

/**
 * @swagger
 * /api/jenis-jaminan:
 *   get:
 *     summary: Get all jenis jaminan
 *     description: Retrieve a list of all active jenis jaminan, ordered by name ascending.
 *     tags: [Jenis Jaminan]
 *     responses:
 *       200:
 *         description: Jenis jaminan retrieved successfully
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
 *                   example: Jenis jaminan retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/JenisJaminan'
 *       500:
 *         description: Failed to retrieve jenis jaminan
 */
router.get("/", getJenisJaminan);

/**
 * @swagger
 * /api/jenis-jaminan/{id}:
 *   get:
 *     summary: Get jenis jaminan by ID
 *     description: Retrieve a single jenis jaminan by its ID. Returns 404 if not found or inactive.
 *     tags: [Jenis Jaminan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The jenis jaminan ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Jenis jaminan retrieved successfully
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
 *                   example: Jenis jaminan retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/JenisJaminan'
 *       404:
 *         description: Jenis jaminan not found
 *       500:
 *         description: Failed to retrieve jenis jaminan
 */
router.get("/:id", getJenisJaminanById);

/**
 * @swagger
 * /api/jenis-jaminan:
 *   post:
 *     summary: Create a new jenis jaminan
 *     description: Create a new jenis jaminan option. Returns 409 if a jenis jaminan with the same name already exists.
 *     tags: [Jenis Jaminan]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JenisJaminanRequest'
 *     responses:
 *       201:
 *         description: Jenis jaminan created successfully
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
 *                   example: Jenis jaminan created successfully
 *                 data:
 *                   $ref: '#/components/schemas/JenisJaminan'
 *       400:
 *         description: Nama is required
 *       409:
 *         description: Jenis jaminan already exists
 *       500:
 *         description: Failed to create jenis jaminan
 */
router.post("/", createJenisJaminan);

/**
 * @swagger
 * /api/jenis-jaminan/{id}:
 *   put:
 *     summary: Update a jenis jaminan
 *     description: Update an existing jenis jaminan by ID. Returns 404 if not found, 409 if the new name conflicts with another jenis jaminan.
 *     tags: [Jenis Jaminan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The jenis jaminan ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JenisJaminanRequest'
 *     responses:
 *       200:
 *         description: Jenis jaminan updated successfully
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
 *                   example: Jenis jaminan updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/JenisJaminan'
 *       400:
 *         description: Nama is required
 *       404:
 *         description: Jenis jaminan not found
 *       409:
 *         description: Jenis jaminan already exists
 *       500:
 *         description: Failed to update jenis jaminan
 */
router.put("/:id", updateJenisJaminan);

/**
 * @swagger
 * /api/jenis-jaminan/{id}:
 *   delete:
 *     summary: Delete a jenis jaminan
 *     description: Soft-delete a jenis jaminan by setting is_active to false. Returns 404 if not found or already inactive.
 *     tags: [Jenis Jaminan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The jenis jaminan ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Jenis jaminan deleted successfully
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
 *                   example: Jenis jaminan deleted successfully
 *                 data:
 *                   type: "null"
 *                   example: null
 *       404:
 *         description: Jenis jaminan not found
 *       500:
 *         description: Failed to delete jenis jaminan
 */
router.delete("/:id", deleteJenisJaminan);

module.exports = router;