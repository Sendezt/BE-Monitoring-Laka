const express = require("express");

const {
    getRumahSakit,
    getRumahSakitById,
    createRumahSakit,
    updateRumahSakit,
    deleteRumahSakit,
} = require("../controllers/rumahSakit.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: RumahSakit
 *   description: Rumah Sakit (Hospital) management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RumahSakit:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nama:
 *           type: string
 *           example: RSUD Kota Semarang
 *         nama_pic:
 *           type: string
 *           example: Dr. Budi Santoso
 *         no_hp_pic:
 *           type: string
 *           example: 081234567890
 *         kode_rumah_sakit:
 *           type: string
 *           example: RSUD-SMG
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
 *     RumahSakitRequest:
 *       type: object
 *       required:
 *         - nama
 *         - nama_pic
 *         - no_hp_pic
 *         - kode_rumah_sakit
 *         - wilayah_id
 *       properties:
 *         nama:
 *           type: string
 *           example: RSUD Kota Semarang
 *         nama_pic:
 *           type: string
 *           example: Dr. Budi Santoso
 *         no_hp_pic:
 *           type: string
 *           example: 081234567890
 *         kode_rumah_sakit:
 *           type: string
 *           example: RSUD-SMG
 *         wilayah_id:
 *           type: integer
 *           example: 1
 */

/**
 * @swagger
 * /api/rumahsakit:
 *   get:
 *     summary: Get all rumah sakit
 *     description: Retrieve a list of all active rumah sakit with their associated wilayah, ordered by name ascending.
 *     tags: [RumahSakit]
 *     responses:
 *       200:
 *         description: Rumah sakit retrieved successfully
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
 *                   example: Rumah sakit retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RumahSakit'
 *       500:
 *         description: Failed to retrieve rumah sakit
 */
router.get("/", getRumahSakit);

/**
 * @swagger
 * /api/rumahsakit/{id}:
 *   get:
 *     summary: Get rumah sakit by ID
 *     description: Retrieve a single rumah sakit by its ID, including the associated wilayah. Returns 404 if not found or inactive.
 *     tags: [RumahSakit]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The rumah sakit ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Rumah sakit retrieved successfully
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
 *                   example: Rumah sakit retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/RumahSakit'
 *       404:
 *         description: Rumah sakit not found
 *       500:
 *         description: Failed to retrieve rumah sakit
 */
router.get("/:id", getRumahSakitById);

/**
 * @swagger
 * /api/rumahsakit:
 *   post:
 *     summary: Create a new rumah sakit
 *     description: Create a new rumah sakit linked to a wilayah. Returns 404 if the wilayah doesn't exist, 400 if it's inactive, 409 if the kode_rumah_sakit already exists or a rumah sakit with the same name already exists in that wilayah.
 *     tags: [RumahSakit]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RumahSakitRequest'
 *     responses:
 *       201:
 *         description: Rumah sakit created successfully
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
 *                   example: Rumah sakit created successfully
 *                 data:
 *                   $ref: '#/components/schemas/RumahSakit'
 *       400:
 *         description: Nama, nama_pic, no_hp_pic, kode_rumah_sakit, and wilayah_id are required / Wilayah is inactive
 *       404:
 *         description: Wilayah not found
 *       409:
 *         description: Kode rumah sakit already exists / Rumah sakit already exists in this wilayah
 *       500:
 *         description: Failed to create rumah sakit
 */
router.post("/", createRumahSakit);

/**
 * @swagger
 * /api/rumahsakit/{id}:
 *   put:
 *     summary: Update a rumah sakit
 *     description: Update an existing rumah sakit by ID. Validates the target wilayah exists and is active. Returns 409 if the new kode_rumah_sakit already exists or the new name conflicts with another rumah sakit in the same wilayah.
 *     tags: [RumahSakit]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The rumah sakit ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RumahSakitRequest'
 *     responses:
 *       200:
 *         description: Rumah sakit updated successfully
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
 *                   example: Rumah sakit updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/RumahSakit'
 *       400:
 *         description: Nama, nama_pic, no_hp_pic, kode_rumah_sakit, and wilayah_id are required / Wilayah is inactive
 *       404:
 *         description: Rumah sakit not found / Wilayah not found
 *       409:
 *         description: Kode rumah sakit already exists / Rumah sakit already exists in this wilayah
 *       500:
 *         description: Failed to update rumah sakit
 */
router.put("/:id", updateRumahSakit);

/**
 * @swagger
 * /api/rumahsakit/{id}:
 *   delete:
 *     summary: Delete a rumah sakit
 *     description: Soft-delete a rumah sakit by setting is_active to false. Returns 404 if not found or already inactive.
 *     tags: [RumahSakit]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The rumah sakit ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Rumah sakit deleted successfully
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
 *                   example: Rumah sakit deleted successfully
 *                 data:
 *                   type: "null"
 *                   example: null
 *       404:
 *         description: Rumah sakit not found
 *       500:
 *         description: Failed to delete rumah sakit
 */
router.delete("/:id", deleteRumahSakit);

module.exports = router;