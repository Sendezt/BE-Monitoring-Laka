const express = require("express");

const {
    getWilayah,
    getWilayahById,
    createWilayah,
    updateWilayah,
    deleteWilayah,
} = require("../controllers/wilayah.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Wilayah
 *   description: Wilayah (Region) management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Wilayah:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nama:
 *           type: string
 *           example: Jawa Tengah
 *         is_active:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-08-15T10:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-08-15T10:00:00.000Z"
 *     WilayahRequest:
 *       type: object
 *       required:
 *         - nama
 *       properties:
 *         nama:
 *           type: string
 *           example: Jawa Tengah
 */

/**
 * @swagger
 * /api/wilayah:
 *   get:
 *     summary: Get all wilayah
 *     description: Retrieve a list of all active wilayah, ordered by name ascending.
 *     tags: [Wilayah]
 *     responses:
 *       200:
 *         description: Wilayah retrieved successfully
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
 *                   example: Wilayah retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Wilayah'
 *       500:
 *         description: Failed to retrieve wilayah
 */
router.get("/", getWilayah);

/**
 * @swagger
 * /api/wilayah/{id}:
 *   get:
 *     summary: Get wilayah by ID
 *     description: Retrieve a single wilayah by its ID. Returns 404 if not found or inactive.
 *     tags: [Wilayah]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The wilayah ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Wilayah retrieved successfully
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
 *                   example: Wilayah retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Wilayah'
 *       404:
 *         description: Wilayah not found
 *       500:
 *         description: Failed to retrieve wilayah
 */
router.get("/:id", getWilayahById);

/**
 * @swagger
 * /api/wilayah:
 *   post:
 *     summary: Create a new wilayah
 *     description: Create a new wilayah region. Returns 409 if a wilayah with the same name already exists.
 *     tags: [Wilayah]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WilayahRequest'
 *     responses:
 *       201:
 *         description: Wilayah created successfully
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
 *                   example: Wilayah created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Wilayah'
 *       400:
 *         description: Nama wilayah is required
 *       409:
 *         description: Wilayah already exists
 *       500:
 *         description: Failed to create wilayah
 */
router.post("/", createWilayah);

/**
 * @swagger
 * /api/wilayah/{id}:
 *   put:
 *     summary: Update a wilayah
 *     description: Update an existing wilayah by ID. Returns 404 if not found, 409 if the new name conflicts with another wilayah.
 *     tags: [Wilayah]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The wilayah ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WilayahRequest'
 *     responses:
 *       200:
 *         description: Wilayah updated successfully
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
 *                   example: Wilayah updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Wilayah'
 *       400:
 *         description: Nama wilayah is required
 *       404:
 *         description: Wilayah not found
 *       409:
 *         description: Wilayah name already exists
 *       500:
 *         description: Failed to update wilayah
 */
router.put("/:id", updateWilayah);

/**
 * @swagger
 * /api/wilayah/{id}:
 *   delete:
 *     summary: Delete a wilayah
 *     description: Soft-delete a wilayah by setting is_active to false. Returns 404 if not found or already inactive.
 *     tags: [Wilayah]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The wilayah ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Wilayah deleted successfully
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
 *                   example: Wilayah deleted successfully
 *                 data:
 *                   type: "null"
 *                   example: null
 *       404:
 *         description: Wilayah not found
 *       500:
 *         description: Failed to delete wilayah
 */
router.delete("/:id", deleteWilayah);

module.exports = router;