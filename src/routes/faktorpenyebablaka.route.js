const express = require("express");

const {
  getFaktorPenyebabLaka,
  getFaktorPenyebabLakaById,
  createFaktorPenyebabLaka,
  updateFaktorPenyebabLaka,
  deleteFaktorPenyebabLaka,
} = require("../controllers/faktorpenyebablaka.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: FaktorPenyebabLaka
 *   description: Faktor Penyebab Laka (Accident causing factors) management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FaktorPenyebabLaka:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nama:
 *           type: string
 *           example: Mengantuk
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
 *     FaktorPenyebabLakaRequest:
 *       type: object
 *       required:
 *         - nama
 *       properties:
 *         nama:
 *           type: string
 *           example: Mengantuk
 */

/**
 * @swagger
 * /api/faktor-penyebab-laka:
 *   get:
 *     summary: Get all faktor penyebab laka
 *     description: Retrieve a list of all active accident causing factors, ordered by name ascending.
 *     tags: [FaktorPenyebabLaka]
 *     responses:
 *       200:
 *         description: Faktor penyebab laka retrieved successfully
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
 *                   example: Faktor penyebab laka retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FaktorPenyebabLaka'
 *       500:
 *         description: Failed to retrieve faktor penyebab laka
 */
router.get("/", getFaktorPenyebabLaka);

/**
 * @swagger
 * /api/faktor-penyebab-laka/{id}:
 *   get:
 *     summary: Get faktor penyebab laka by ID
 *     description: Retrieve a single accident causing factor by its ID. Returns 404 if not found or inactive.
 *     tags: [FaktorPenyebabLaka]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The factor ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Faktor penyebab laka retrieved successfully
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
 *                   example: Faktor penyebab laka retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/FaktorPenyebabLaka'
 *       404:
 *         description: Faktor penyebab laka not found
 *       500:
 *         description: Failed to retrieve faktor penyebab laka
 */
router.get("/:id", getFaktorPenyebabLakaById);

/**
 * @swagger
 * /api/faktor-penyebab-laka:
 *   post:
 *     summary: Create a new faktor penyebab laka
 *     description: Create a new accident causing factor. Returns 409 if a factor with the same name already exists.
 *     tags: [FaktorPenyebabLaka]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FaktorPenyebabLakaRequest'
 *     responses:
 *       201:
 *         description: Faktor penyebab laka created successfully
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
 *                   example: Faktor penyebab laka created successfully
 *                 data:
 *                   $ref: '#/components/schemas/FaktorPenyebabLaka'
 *       400:
 *         description: Nama is required
 *       409:
 *         description: Faktor penyebab laka already exists
 *       500:
 *         description: Failed to create faktor penyebab laka
 */
router.post("/", createFaktorPenyebabLaka);

/**
 * @swagger
 * /api/faktor-penyebab-laka/{id}:
 *   put:
 *     summary: Update a faktor penyebab laka
 *     description: Update an existing accident causing factor by ID. Returns 404 if not found, 409 if the new name conflicts with another factor.
 *     tags: [FaktorPenyebabLaka]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The factor ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FaktorPenyebabLakaRequest'
 *     responses:
 *       200:
 *         description: Faktor penyebab laka updated successfully
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
 *                   example: Faktor penyebab laka updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/FaktorPenyebabLaka'
 *       400:
 *         description: Nama is required
 *       404:
 *         description: Faktor penyebab laka not found
 *       409:
 *         description: Faktor penyebab laka already exists
 *       500:
 *         description: Failed to update faktor penyebab laka
 */
router.put("/:id", updateFaktorPenyebabLaka);

/**
 * @swagger
 * /api/faktor-penyebab-laka/{id}:
 *   delete:
 *     summary: Delete a faktor penyebab laka
 *     description: Soft-delete an accident causing factor by setting is_active to false. Returns 404 if not found or already inactive.
 *     tags: [FaktorPenyebabLaka]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The factor ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Faktor penyebab laka deleted successfully
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
 *                   example: Faktor penyebab laka deleted successfully
 *                 data:
 *                   type: "null"
 *                   example: null
 *       404:
 *         description: Faktor penyebab laka not found
 *       500:
 *         description: Failed to delete faktor penyebab laka
 */
router.delete("/:id", deleteFaktorPenyebabLaka);

module.exports = router;
