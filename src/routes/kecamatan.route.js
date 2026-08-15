const express = require("express");

const {
    getKecamatan,
    getKecamatanById,
    createKecamatan,
    updateKecamatan,
    deleteKecamatan,
} = require("../controllers/kecamatan.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Kecamatan
 *   description: Kecamatan (Sub-district) management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Kecamatan:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nama:
 *           type: string
 *           example: Tembalang
 *         polres_id:
 *           type: integer
 *           example: 1
 *         is_active:
 *           type: boolean
 *           example: true
 *         polres:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             nama:
 *               type: string
 *               example: Polres Semarang
 *             wilayah_id:
 *               type: integer
 *               example: 1
 *             wilayah:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 nama:
 *                   type: string
 *                   example: Jawa Tengah
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2026-08-15T10:00:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2026-08-15T10:00:00.000Z"
 *     KecamatanRequest:
 *       type: object
 *       required:
 *         - nama
 *         - polres_id
 *       properties:
 *         nama:
 *           type: string
 *           example: Tembalang
 *         polres_id:
 *           type: integer
 *           example: 1
 */

/**
 * @swagger
 * /api/kecamatan:
 *   get:
 *     summary: Get all kecamatan
 *     description: Retrieve a list of all active kecamatan with their associated polres and wilayah, ordered by name ascending.
 *     tags: [Kecamatan]
 *     responses:
 *       200:
 *         description: Kecamatan retrieved successfully
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
 *                   example: Kecamatan retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Kecamatan'
 *       500:
 *         description: Failed to retrieve kecamatan
 */
router.get("/", getKecamatan);

/**
 * @swagger
 * /api/kecamatan/{id}:
 *   get:
 *     summary: Get kecamatan by ID
 *     description: Retrieve a single kecamatan by its ID, including the associated polres and wilayah. Returns 404 if not found or inactive.
 *     tags: [Kecamatan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The kecamatan ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Kecamatan retrieved successfully
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
 *                   example: Kecamatan retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Kecamatan'
 *       404:
 *         description: Kecamatan not found
 *       500:
 *         description: Failed to retrieve kecamatan
 */
router.get("/:id", getKecamatanById);

/**
 * @swagger
 * /api/kecamatan:
 *   post:
 *     summary: Create a new kecamatan
 *     description: Create a new kecamatan linked to a polres. Returns 404 if the polres doesn't exist, 400 if it's inactive, 409 if a kecamatan with the same name already exists in that polres.
 *     tags: [Kecamatan]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KecamatanRequest'
 *     responses:
 *       201:
 *         description: Kecamatan created successfully
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
 *                   example: Kecamatan created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Kecamatan'
 *       400:
 *         description: Nama and polres_id are required / Polres is inactive
 *       404:
 *         description: Polres not found
 *       409:
 *         description: Kecamatan already exists in this polres
 *       500:
 *         description: Failed to create kecamatan
 */
router.post("/", createKecamatan);

/**
 * @swagger
 * /api/kecamatan/{id}:
 *   put:
 *     summary: Update a kecamatan
 *     description: Update an existing kecamatan by ID. Validates the target polres exists and is active. Returns 409 if the new name conflicts with another kecamatan in the same polres.
 *     tags: [Kecamatan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The kecamatan ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KecamatanRequest'
 *     responses:
 *       200:
 *         description: Kecamatan updated successfully
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
 *                   example: Kecamatan updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Kecamatan'
 *       400:
 *         description: Nama and polres_id are required / Polres is inactive
 *       404:
 *         description: Kecamatan not found / Polres not found
 *       409:
 *         description: Kecamatan already exists in this polres
 *       500:
 *         description: Failed to update kecamatan
 */
router.put("/:id", updateKecamatan);

/**
 * @swagger
 * /api/kecamatan/{id}:
 *   delete:
 *     summary: Delete a kecamatan
 *     description: Soft-delete a kecamatan by setting is_active to false. Returns 404 if not found or already inactive.
 *     tags: [Kecamatan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The kecamatan ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Kecamatan deleted successfully
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
 *                   example: Kecamatan deleted successfully
 *                 data:
 *                   type: "null"
 *                   example: null
 *       404:
 *         description: Kecamatan not found
 *       500:
 *         description: Failed to delete kecamatan
 */
router.delete("/:id", deleteKecamatan);

module.exports = router;