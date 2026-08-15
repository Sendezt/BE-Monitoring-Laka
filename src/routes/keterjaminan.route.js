const express = require("express");

const {
    getKeterjaminan,
    getKeterjaminanById,
    createKeterjaminan,
    updateKeterjaminan,
    deleteKeterjaminan,
} = require("../controllers/keterjaminan.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Keterjaminan
 *   description: Keterjaminan (Guarantee status/Insurance status) management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Keterjaminan:
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
 *     KeterjaminanRequest:
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
 * /api/keterjaminan:
 *   get:
 *     summary: Get all keterjaminan
 *     description: Retrieve a list of all active keterjaminan, ordered by name ascending.
 *     tags: [Keterjaminan]
 *     responses:
 *       200:
 *         description: Keterjaminan retrieved successfully
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
 *                   example: Keterjaminan retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Keterjaminan'
 *       500:
 *         description: Failed to retrieve keterjaminan
 */
router.get("/", getKeterjaminan);

/**
 * @swagger
 * /api/keterjaminan/{id}:
 *   get:
 *     summary: Get keterjaminan by ID
 *     description: Retrieve a single keterjaminan by its ID. Returns 404 if not found or inactive.
 *     tags: [Keterjaminan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The keterjaminan ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Keterjaminan retrieved successfully
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
 *                   example: Keterjaminan retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Keterjaminan'
 *       404:
 *         description: Keterjaminan not found
 *       500:
 *         description: Failed to retrieve keterjaminan
 */
router.get("/:id", getKeterjaminanById);

/**
 * @swagger
 * /api/keterjaminan:
 *   post:
 *     summary: Create a new keterjaminan
 *     description: Create a new keterjaminan option. Returns 409 if a keterjaminan with the same name already exists.
 *     tags: [Keterjaminan]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KeterjaminanRequest'
 *     responses:
 *       201:
 *         description: Keterjaminan created successfully
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
 *                   example: Keterjaminan created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Keterjaminan'
 *       400:
 *         description: Nama is required
 *       409:
 *         description: Keterjaminan already exists
 *       500:
 *         description: Failed to create keterjaminan
 */
router.post("/", createKeterjaminan);

/**
 * @swagger
 * /api/keterjaminan/{id}:
 *   put:
 *     summary: Update a keterjaminan
 *     description: Update an existing keterjaminan by ID. Returns 404 if not found, 409 if the new name conflicts with another keterjaminan.
 *     tags: [Keterjaminan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The keterjaminan ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KeterjaminanRequest'
 *     responses:
 *       200:
 *         description: Keterjaminan updated successfully
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
 *                   example: Keterjaminan updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Keterjaminan'
 *       400:
 *         description: Nama is required
 *       404:
 *         description: Keterjaminan not found
 *       409:
 *         description: Keterjaminan already exists
 *       500:
 *         description: Failed to update keterjaminan
 */
router.put("/:id", updateKeterjaminan);

/**
 * @swagger
 * /api/keterjaminan/{id}:
 *   delete:
 *     summary: Delete a keterjaminan
 *     description: Soft-delete a keterjaminan by setting is_active to false. Returns 404 if not found or already inactive.
 *     tags: [Keterjaminan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The keterjaminan ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Keterjaminan deleted successfully
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
 *                   example: Keterjaminan deleted successfully
 *                 data:
 *                   type: "null"
 *                   example: null
 *       404:
 *         description: Keterjaminan not found
 *       500:
 *         description: Failed to delete keterjaminan
 */
router.delete("/:id", deleteKeterjaminan);

module.exports = router;