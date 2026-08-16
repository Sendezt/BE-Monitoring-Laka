const express = require("express");

const {
    getProfesi,
    getProfesiById,
    createProfesi,
    updateProfesi,
    deleteProfesi,
} = require("../controllers/profesi.controller");

const router = express.Router();

const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Profesi
 *   description: Profesi (Profession/Occupation) management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Profesi:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nama:
 *           type: string
 *           example: Pegawai Negeri Sipil (PNS)
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
 *     ProfesiRequest:
 *       type: object
 *       required:
 *         - nama
 *       properties:
 *         nama:
 *           type: string
 *           example: Pegawai Negeri Sipil (PNS)
 */

/**
 * @swagger
 * /api/profesi:
 *   get:
 *     summary: Get all profesi
 *     description: Retrieve a list of all active profesi, ordered by name ascending.
 *     tags: [Profesi]
 *     responses:
 *       200:
 *         description: Profesi retrieved successfully
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
 *                   example: Profesi retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Profesi'
 *       500:
 *         description: Failed to retrieve profesi
 */
router.get("/", verifyToken, getProfesi);

/**
 * @swagger
 * /api/profesi/{id}:
 *   get:
 *     summary: Get profesi by ID
 *     description: Retrieve a single profesi by its ID. Returns 404 if not found or inactive.
 *     tags: [Profesi]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The profesi ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Profesi retrieved successfully
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
 *                   example: Profesi retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Profesi'
 *       404:
 *         description: Profesi not found
 *       500:
 *         description: Failed to retrieve profesi
 */
router.get("/:id", verifyToken, getProfesiById);

/**
 * @swagger
 * /api/profesi:
 *   post:
 *     summary: Create a new profesi
 *     description: Create a new profesi option. Returns 409 if a profesi with the same name already exists.
 *     tags: [Profesi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfesiRequest'
 *     responses:
 *       201:
 *         description: Profesi created successfully
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
 *                   example: Profesi created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Profesi'
 *       400:
 *         description: Nama is required
 *       409:
 *         description: Profesi already exists
 *       500:
 *         description: Failed to create profesi
 */
router.post("/", verifyToken, checkRole(["admin"]), createProfesi);

/**
 * @swagger
 * /api/profesi/{id}:
 *   put:
 *     summary: Update a profesi
 *     description: Update an existing profesi by ID. Returns 404 if not found, 409 if the new name conflicts with another profesi.
 *     tags: [Profesi]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The profesi ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfesiRequest'
 *     responses:
 *       200:
 *         description: Profesi updated successfully
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
 *                   example: Profesi updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Profesi'
 *       400:
 *         description: Nama is required
 *       404:
 *         description: Profesi not found
 *       409:
 *         description: Profesi already exists
 *       500:
 *         description: Failed to update profesi
 */
router.put("/:id", verifyToken, checkRole(["admin"]), updateProfesi);

/**
 * @swagger
 * /api/profesi/{id}:
 *   delete:
 *     summary: Delete a profesi
 *     description: Soft-delete a profesi by setting is_active to false. Returns 404 if not found or already inactive.
 *     tags: [Profesi]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The profesi ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Profesi deleted successfully
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
 *                   example: Profesi deleted successfully
 *                 data:
 *                   type: "null"
 *                   example: null
 *       404:
 *         description: Profesi not found
 *       500:
 *         description: Failed to delete profesi
 */
router.delete("/:id", verifyToken, checkRole(["admin"]), deleteProfesi);

module.exports = router;

