const express = require("express");

const {
  getKasusTabrakKecelakaan,
  getKasusTabrakKecelakaanById,
  createKasusTabrakKecelakaan,
  updateKasusTabrakKecelakaan,
  deleteKasusTabrakKecelakaan,
} = require("../controllers/kasustabrakkecelakaan.controller");

const router = express.Router();

const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: KasusTabrakKecelakaan
 *   description: Kasus Tabrak Kecelakaan (Accident case types) management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     KasusTabrakKecelakaan:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nama:
 *           type: string
 *           example: Tabrakan Dua Kendaraan
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
 *     KasusTabrakKecelakaanRequest:
 *       type: object
 *       required:
 *         - nama
 *       properties:
 *         nama:
 *           type: string
 *           example: Tabrakan Dua Kendaraan
 */

/**
 * @swagger
 * /api/kasus-tabrak-kecelakaan:
 *   get:
 *     summary: Get all kasus tabrak kecelakaan
 *     description: Retrieve a list of all active kasus tabrak kecelakaan, ordered by name ascending.
 *     tags: [KasusTabrakKecelakaan]
 *     responses:
 *       200:
 *         description: Kasus tabrak kecelakaan retrieved successfully
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
 *                   example: Kasus tabrak kecelakaan retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/KasusTabrakKecelakaan'
 *       500:
 *         description: Failed to retrieve kasus tabrak kecelakaan
 */
router.get("/", verifyToken, getKasusTabrakKecelakaan);

/**
 * @swagger
 * /api/kasus-tabrak-kecelakaan/{id}:
 *   get:
 *     summary: Get kasus tabrak kecelakaan by ID
 *     description: Retrieve a single kasus tabrak kecelakaan by its ID. Returns 404 if not found or inactive.
 *     tags: [KasusTabrakKecelakaan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The kasus tabrak kecelakaan ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Kasus tabrak kecelakaan retrieved successfully
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
 *                   example: Kasus tabrak kecelakaan retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/KasusTabrakKecelakaan'
 *       404:
 *         description: Kasus tabrak kecelakaan not found
 *       500:
 *         description: Failed to retrieve kasus tabrak kecelakaan
 */
router.get("/:id", verifyToken, getKasusTabrakKecelakaanById);

/**
 * @swagger
 * /api/kasus-tabrak-kecelakaan:
 *   post:
 *     summary: Create a new kasus tabrak kecelakaan
 *     description: Create a new kasus tabrak kecelakaan. Returns 409 if a kasus tabrak kecelakaan with the same name already exists.
 *     tags: [KasusTabrakKecelakaan]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KasusTabrakKecelakaanRequest'
 *     responses:
 *       201:
 *         description: Kasus tabrak kecelakaan created successfully
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
 *                   example: Kasus tabrak kecelakaan created successfully
 *                 data:
 *                   $ref: '#/components/schemas/KasusTabrakKecelakaan'
 *       400:
 *         description: Nama is required
 *       409:
 *         description: Kasus tabrak kecelakaan already exists
 *       500:
 *         description: Failed to create kasus tabrak kecelakaan
 */
router.post("/", verifyToken, checkRole(["admin"]), createKasusTabrakKecelakaan);

/**
 * @swagger
 * /api/kasus-tabrak-kecelakaan/{id}:
 *   put:
 *     summary: Update a kasus tabrak kecelakaan
 *     description: Update an existing kasus tabrak kecelakaan by ID. Returns 404 if not found, 409 if the new name conflicts with another kasus tabrak kecelakaan.
 *     tags: [KasusTabrakKecelakaan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The kasus tabrak kecelakaan ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KasusTabrakKecelakaanRequest'
 *     responses:
 *       200:
 *         description: Kasus tabrak kecelakaan updated successfully
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
 *                   example: Kasus tabrak kecelakaan updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/KasusTabrakKecelakaan'
 *       400:
 *         description: Nama is required
 *       404:
 *         description: Kasus tabrak kecelakaan not found
 *       409:
 *         description: Kasus tabrak kecelakaan already exists
 *       500:
 *         description: Failed to update kasus tabrak kecelakaan
 */
router.put("/:id", verifyToken, checkRole(["admin"]), updateKasusTabrakKecelakaan);

/**
 * @swagger
 * /api/kasus-tabrak-kecelakaan/{id}:
 *   delete:
 *     summary: Delete a kasus tabrak kecelakaan
 *     description: Soft-delete a kasus tabrak kecelakaan by setting is_active to false. Returns 404 if not found or already inactive.
 *     tags: [KasusTabrakKecelakaan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The kasus tabrak kecelakaan ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Kasus tabrak kecelakaan deleted successfully
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
 *                   example: Kasus tabrak kecelakaan deleted successfully
 *                 data:
 *                   type: "null"
 *                   example: null
 *       404:
 *         description: Kasus tabrak kecelakaan not found
 *       500:
 *         description: Failed to delete kasus tabrak kecelakaan
 */
router.delete("/:id", verifyToken, checkRole(["admin"]), deleteKasusTabrakKecelakaan);

module.exports = router;


