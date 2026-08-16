const express = require("express");

const {
    getPolres,
    getPolresById,
    createPolres,
    updatePolres,
    deletePolres,
} = require("../controllers/polres.controller");

const router = express.Router();

const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Polres
 *   description: Polres (Police Resort) management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Polres:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nama:
 *           type: string
 *           example: Polres Semarang
 *         wilayah_id:
 *           type: integer
 *           example: 1
 *         is_active:
 *           type: boolean
 *           example: true
 *         wilayah:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             nama:
 *               type: string
 *               example: Jawa Tengah
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2026-08-15T10:00:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2026-08-15T10:00:00.000Z"
 *     PolresRequest:
 *       type: object
 *       required:
 *         - nama
 *         - wilayah_id
 *       properties:
 *         nama:
 *           type: string
 *           example: Polres Semarang
 *         wilayah_id:
 *           type: integer
 *           example: 1
 */

/**
 * @swagger
 * /api/polres:
 *   get:
 *     summary: Get all polres
 *     description: Retrieve a list of all active polres with their associated wilayah, ordered by name ascending.
 *     tags: [Polres]
 *     responses:
 *       200:
 *         description: Polres retrieved successfully
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
 *                   example: Polres retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Polres'
 *       500:
 *         description: Failed to retrieve polres
 */
router.get("/", verifyToken, getPolres);

/**
 * @swagger
 * /api/polres/{id}:
 *   get:
 *     summary: Get polres by ID
 *     description: Retrieve a single polres by its ID, including the associated wilayah. Returns 404 if not found or inactive.
 *     tags: [Polres]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The polres ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Polres retrieved successfully
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
 *                   example: Polres retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Polres'
 *       404:
 *         description: Polres not found
 *       500:
 *         description: Failed to retrieve polres
 */
router.get("/:id", verifyToken, getPolresById);

/**
 * @swagger
 * /api/polres:
 *   post:
 *     summary: Create a new polres
 *     description: Create a new polres linked to a wilayah. Returns 404 if the wilayah doesn't exist, 400 if it's inactive, 409 if a polres with the same name already exists in that wilayah.
 *     tags: [Polres]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PolresRequest'
 *     responses:
 *       201:
 *         description: Polres created successfully
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
 *                   example: Polres created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Polres'
 *       400:
 *         description: Nama and wilayah_id are required / Wilayah is inactive
 *       404:
 *         description: Wilayah not found
 *       409:
 *         description: Polres already exists in this wilayah
 *       500:
 *         description: Failed to create polres
 */
router.post("/", verifyToken, checkRole(["admin"]), createPolres);

/**
 * @swagger
 * /api/polres/{id}:
 *   put:
 *     summary: Update a polres
 *     description: Update an existing polres by ID. Validates the target wilayah exists and is active. Returns 409 if the new name conflicts with another polres in the same wilayah.
 *     tags: [Polres]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The polres ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PolresRequest'
 *     responses:
 *       200:
 *         description: Polres updated successfully
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
 *                   example: Polres updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Polres'
 *       400:
 *         description: Nama and wilayah_id are required / Wilayah is inactive
 *       404:
 *         description: Polres not found / Wilayah not found
 *       409:
 *         description: Polres already exists in this wilayah
 *       500:
 *         description: Failed to update polres
 */
router.put("/:id", verifyToken, checkRole(["admin"]), updatePolres);

/**
 * @swagger
 * /api/polres/{id}:
 *   delete:
 *     summary: Delete a polres
 *     description: Soft-delete a polres by setting is_active to false. Returns 404 if not found or already inactive.
 *     tags: [Polres]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The polres ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Polres deleted successfully
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
 *                   example: Polres deleted successfully
 *                 data:
 *                   type: "null"
 *                   example: null
 *       404:
 *         description: Polres not found
 *       500:
 *         description: Failed to delete polres
 */
router.delete("/:id", verifyToken, checkRole(["admin"]), deletePolres);

module.exports = router;

