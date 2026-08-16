const express = require("express");

const {
    getJenisKendaraan,
    getJenisKendaraanById,
    createJenisKendaraan,
    updateJenisKendaraan,
    deleteJenisKendaraan,
} = require("../controllers/jeniskendaraan.controller");

const router = express.Router();

const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: JenisKendaraan
 *   description: Jenis Kendaraan (Vehicle type) management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     JenisKendaraan:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nama:
 *           type: string
 *           example: Sepeda Motor
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
 *     JenisKendaraanRequest:
 *       type: object
 *       required:
 *         - nama
 *       properties:
 *         nama:
 *           type: string
 *           example: Sepeda Motor
 */

/**
 * @swagger
 * /api/jenis-kendaraan:
 *   get:
 *     summary: Get all jenis kendaraan
 *     description: Retrieve a list of all active jenis kendaraan, ordered by name ascending.
 *     tags: [JenisKendaraan]
 *     responses:
 *       200:
 *         description: Jenis kendaraan retrieved successfully
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
 *                   example: Jenis kendaraan retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/JenisKendaraan'
 *       500:
 *         description: Failed to retrieve jenis kendaraan
 */
router.get("/", verifyToken, getJenisKendaraan);

/**
 * @swagger
 * /api/jenis-kendaraan/{id}:
 *   get:
 *     summary: Get jenis kendaraan by ID
 *     description: Retrieve a single jenis kendaraan by its ID. Returns 404 if not found or inactive.
 *     tags: [JenisKendaraan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The jenis kendaraan ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Jenis kendaraan retrieved successfully
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
 *                   example: Jenis kendaraan retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/JenisKendaraan'
 *       404:
 *         description: Jenis kendaraan not found
 *       500:
 *         description: Failed to retrieve jenis kendaraan
 */
router.get("/:id", verifyToken, getJenisKendaraanById);

/**
 * @swagger
 * /api/jenis-kendaraan:
 *   post:
 *     summary: Create a new jenis kendaraan
 *     description: Create a new jenis kendaraan option. Returns 409 if a jenis kendaraan with the same name already exists.
 *     tags: [JenisKendaraan]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JenisKendaraanRequest'
 *     responses:
 *       201:
 *         description: Jenis kendaraan created successfully
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
 *                   example: Jenis kendaraan created successfully
 *                 data:
 *                   $ref: '#/components/schemas/JenisKendaraan'
 *       400:
 *         description: Nama is required
 *       409:
 *         description: Jenis kendaraan already exists
 *       500:
 *         description: Failed to create jenis kendaraan
 */
router.post("/", verifyToken, checkRole(["admin"]), createJenisKendaraan);

/**
 * @swagger
 * /api/jenis-kendaraan/{id}:
 *   put:
 *     summary: Update a jenis kendaraan
 *     description: Update an existing jenis kendaraan by ID. Returns 404 if not found, 409 if the new name conflicts with another jenis kendaraan.
 *     tags: [JenisKendaraan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The jenis kendaraan ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JenisKendaraanRequest'
 *     responses:
 *       200:
 *         description: Jenis kendaraan updated successfully
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
 *                   example: Jenis kendaraan updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/JenisKendaraan'
 *       400:
 *         description: Nama is required
 *       404:
 *         description: Jenis kendaraan not found
 *       409:
 *         description: Jenis kendaraan already exists
 *       500:
 *         description: Failed to update jenis kendaraan
 */
router.put("/:id", verifyToken, checkRole(["admin"]), updateJenisKendaraan);

/**
 * @swagger
 * /api/jenis-kendaraan/{id}:
 *   delete:
 *     summary: Delete a jenis kendaraan
 *     description: Soft-delete a jenis kendaraan by setting is_active to false. Returns 404 if not found or already inactive.
 *     tags: [JenisKendaraan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The jenis kendaraan ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Jenis kendaraan deleted successfully
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
 *                   example: Jenis kendaraan deleted successfully
 *                 data:
 *                   type: "null"
 *                   example: null
 *       404:
 *         description: Jenis kendaraan not found
 *       500:
 *         description: Failed to delete jenis kendaraan
 */
router.delete("/:id", verifyToken, checkRole(["admin"]), deleteJenisKendaraan);

module.exports = router;

