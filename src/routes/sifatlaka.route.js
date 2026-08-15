const express = require("express");

const {
  getSifatLaka,
  getSifatLakaById,
  createSifatLaka,
  updateSifatLaka,
  deleteSifatLaka,
} = require("../controllers/sifatLaka.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: SifatLaka
 *   description: Sifat Laka (Accident severity/nature classification) management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SifatLaka:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nama:
 *           type: string
 *           example: Luka Berat
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
 *     SifatLakaRequest:
 *       type: object
 *       required:
 *         - nama
 *       properties:
 *         nama:
 *           type: string
 *           example: Luka Berat
 */

/**
 * @swagger
 * /api/sifat-laka:
 *   get:
 *     summary: Get all sifat laka
 *     description: Retrieve a list of all active accident classifications, ordered by name ascending.
 *     tags: [SifatLaka]
 *     responses:
 *       200:
 *         description: Sifat laka retrieved successfully
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
 *                   example: Sifat laka retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SifatLaka'
 *       500:
 *         description: Failed to retrieve sifat laka
 */
router.get("/", getSifatLaka);

/**
 * @swagger
 * /api/sifat-laka/{id}:
 *   get:
 *     summary: Get sifat laka by ID
 *     description: Retrieve a single accident classification by its ID. Returns 404 if not found or inactive.
 *     tags: [SifatLaka]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The classification ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Sifat laka retrieved successfully
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
 *                   example: Sifat laka retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/SifatLaka'
 *       404:
 *         description: Sifat laka not found
 *       500:
 *         description: Failed to retrieve sifat laka
 */
router.get("/:id", getSifatLakaById);

/**
 * @swagger
 * /api/sifat-laka:
 *   post:
 *     summary: Create a new sifat laka
 *     description: Create a new accident classification. Returns 409 if a classification with the same name already exists.
 *     tags: [SifatLaka]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SifatLakaRequest'
 *     responses:
 *       201:
 *         description: Sifat laka created successfully
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
 *                   example: Sifat laka created successfully
 *                 data:
 *                   $ref: '#/components/schemas/SifatLaka'
 *       400:
 *         description: Nama is required
 *       409:
 *         description: Sifat laka already exists
 *       500:
 *         description: Failed to create sifat laka
 */
router.post("/", createSifatLaka);

/**
 * @swagger
 * /api/sifat-laka/{id}:
 *   put:
 *     summary: Update a sifat laka
 *     description: Update an existing accident classification by ID. Returns 404 if not found, 409 if the new name conflicts with another classification.
 *     tags: [SifatLaka]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The classification ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SifatLakaRequest'
 *     responses:
 *       200:
 *         description: Sifat laka updated successfully
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
 *                   example: Sifat laka updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/SifatLaka'
 *       400:
 *         description: Nama is required
 *       404:
 *         description: Sifat laka not found
 *       409:
 *         description: Sifat laka already exists
 *       500:
 *         description: Failed to update sifat laka
 */
router.put("/:id", updateSifatLaka);

/**
 * @swagger
 * /api/sifat-laka/{id}:
 *   delete:
 *     summary: Delete a sifat laka
 *     description: Soft-delete an accident classification by setting is_active to false. Returns 404 if not found or already inactive.
 *     tags: [SifatLaka]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The classification ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Sifat laka deleted successfully
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
 *                   example: Sifat laka deleted successfully
 *                 data:
 *                   type: "null"
 *                   example: null
 *       404:
 *         description: Sifat laka not found
 *       500:
 *         description: Failed to delete sifat laka
 */
router.delete("/:id", deleteSifatLaka);

module.exports = router;
