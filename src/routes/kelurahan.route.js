const express = require("express");

const {
    getKelurahan,
    getKelurahanById,
    createKelurahan,
    updateKelurahan,
    deleteKelurahan,
} = require("../controllers/kelurahan.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Kelurahan
 *   description: Kelurahan (Sub-district area) management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Kelurahan:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nama:
 *           type: string
 *           example: Kelurahan Bulusan
 *         kecamatan_id:
 *           type: integer
 *           example: 1
 *         is_active:
 *           type: boolean
 *           example: true
 *         kecamatan:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             nama:
 *               type: string
 *               example: Tembalang
 *             polres_id:
 *               type: integer
 *               example: 1
 *             polres:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 nama:
 *                   type: string
 *                   example: Polres Semarang
 *                 wilayah_id:
 *                   type: integer
 *                   example: 1
 *                 wilayah:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nama:
 *                       type: string
 *                       example: Jawa Tengah
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2026-08-15T10:00:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2026-08-15T10:00:00.000Z"
 *     KelurahanRequest:
 *       type: object
 *       required:
 *         - nama
 *         - kecamatan_id
 *       properties:
 *         nama:
 *           type: string
 *           example: Kelurahan Bulusan
 *         kecamatan_id:
 *           type: integer
 *           example: 1
 */

/**
 * @swagger
 * /api/kelurahan:
 *   get:
 *     summary: Get all kelurahan
 *     description: Retrieve a list of all active kelurahan with their nested kecamatan, polres, and wilayah associations.
 *     tags: [Kelurahan]
 *     responses:
 *       200:
 *         description: Kelurahan retrieved successfully
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
 *                   example: Kelurahan retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Kelurahan'
 *       500:
 *         description: Failed to retrieve kelurahan
 */
router.get("/", getKelurahan);

/**
 * @swagger
 * /api/kelurahan/{id}:
 *   get:
 *     summary: Get kelurahan by ID
 *     description: Retrieve a single kelurahan by its ID, including all nested associations (kecamatan, polres, wilayah). Returns 404 if not found or inactive.
 *     tags: [Kelurahan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The kelurahan ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Kelurahan retrieved successfully
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
 *                   example: Kelurahan retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Kelurahan'
 *       404:
 *         description: Kelurahan not found
 *       500:
 *         description: Failed to retrieve kelurahan
 */
router.get("/:id", getKelurahanById);

/**
 * @swagger
 * /api/kelurahan:
 *   post:
 *     summary: Create a new kelurahan
 *     description: Create a new kelurahan linked to a kecamatan. Returns 404 if the kecamatan doesn't exist, 400 if it's inactive, 409 if a kelurahan with the same name already exists in that kecamatan.
 *     tags: [Kelurahan]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KelurahanRequest'
 *     responses:
 *       201:
 *         description: Kelurahan created successfully
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
 *                   example: Kelurahan created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Kelurahan'
 *       400:
 *         description: Nama and kecamatan_id are required / Kecamatan is inactive
 *       404:
 *         description: Kecamatan not found
 *       409:
 *         description: Kelurahan already exists in this kecamatan
 *       500:
 *         description: Failed to create kelurahan
 */
router.post("/", createKelurahan);

/**
 * @swagger
 * /api/kelurahan/{id}:
 *   put:
 *     summary: Update a kelurahan
 *     description: Update an existing kelurahan by ID. Validates the target kecamatan exists and is active. Returns 409 if the new name conflicts with another kelurahan in the same kecamatan.
 *     tags: [Kelurahan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The kelurahan ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KelurahanRequest'
 *     responses:
 *       200:
 *         description: Kelurahan updated successfully
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
 *                   example: Kelurahan updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Kelurahan'
 *       400:
 *         description: Nama and kecamatan_id are required / Kecamatan is inactive
 *       404:
 *         description: Kelurahan not found / Kecamatan not found
 *       409:
 *         description: Kelurahan already exists in this kecamatan
 *       500:
 *         description: Failed to update kelurahan
 */
router.put("/:id", updateKelurahan);

/**
 * @swagger
 * /api/kelurahan/{id}:
 *   delete:
 *     summary: Delete a kelurahan
 *     description: Soft-delete a kelurahan by setting is_active to false. Returns 404 if not found or already inactive.
 *     tags: [Kelurahan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The kelurahan ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Kelurahan deleted successfully
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
 *                   example: Kelurahan deleted successfully
 *                 data:
 *                   type: "null"
 *                   example: null
 *       404:
 *         description: Kelurahan not found
 *       500:
 *         description: Failed to delete kelurahan
 */
router.delete("/:id", deleteKelurahan);

module.exports = router;