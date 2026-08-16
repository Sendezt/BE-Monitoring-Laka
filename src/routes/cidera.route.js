const express = require("express");

const {
    getCidera,
    getCideraById,
    createCidera,
    updateCidera,
    deleteCidera,
} = require("../controllers/cidera.controller");

const router = express.Router();

const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Cidera
 *   description: Cidera (Injury/Severity level) management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Cidera:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nama:
 *           type: string
 *           example: Luka Ringan (LR)
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
 *     CideraRequest:
 *       type: object
 *       required:
 *         - nama
 *       properties:
 *         nama:
 *           type: string
 *           example: Luka Ringan (LR)
 */

/**
 * @swagger
 * /api/cidera:
 *   get:
 *     summary: Get all cidera
 *     description: Retrieve a list of all active cidera, ordered by name ascending.
 *     tags: [Cidera]
 *     responses:
 *       200:
 *         description: Cidera retrieved successfully
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
 *                   example: Cidera retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Cidera'
 *       500:
 *         description: Failed to retrieve cidera
 */
router.get("/", verifyToken, getCidera);

/**
 * @swagger
 * /api/cidera/{id}:
 *   get:
 *     summary: Get cidera by ID
 *     description: Retrieve a single cidera by its ID. Returns 404 if not found or inactive.
 *     tags: [Cidera]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The cidera ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Cidera retrieved successfully
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
 *                   example: Cidera retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Cidera'
 *       404:
 *         description: Cidera not found
 *       500:
 *         description: Failed to retrieve cidera
 */
router.get("/:id", verifyToken, getCideraById);

/**
 * @swagger
 * /api/cidera:
 *   post:
 *     summary: Create a new cidera
 *     description: Create a new cidera option. Returns 409 if a cidera with the same name already exists.
 *     tags: [Cidera]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CideraRequest'
 *     responses:
 *       201:
 *         description: Cidera created successfully
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
 *                   example: Cidera created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Cidera'
 *       400:
 *         description: Nama is required
 *       409:
 *         description: Cidera already exists
 *       500:
 *         description: Failed to create cidera
 */
router.post("/", verifyToken, checkRole(["admin"]), createCidera);

/**
 * @swagger
 * /api/cidera/{id}:
 *   put:
 *     summary: Update a cidera
 *     description: Update an existing cidera by ID. Returns 404 if not found, 409 if the new name conflicts with another cidera.
 *     tags: [Cidera]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The cidera ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CideraRequest'
 *     responses:
 *       200:
 *         description: Cidera updated successfully
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
 *                   example: Cidera updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Cidera'
 *       400:
 *         description: Nama is required
 *       404:
 *         description: Cidera not found
 *       409:
 *         description: Cidera already exists
 *       500:
 *         description: Failed to update cidera
 */
router.put("/:id", verifyToken, checkRole(["admin"]), updateCidera);

/**
 * @swagger
 * /api/cidera/{id}:
 *   delete:
 *     summary: Delete a cidera
 *     description: Soft-delete a cidera by setting is_active to false. Returns 404 if not found or already inactive.
 *     tags: [Cidera]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The cidera ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Cidera deleted successfully
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
 *                   example: Cidera deleted successfully
 *                 data:
 *                   type: "null"
 *                   example: null
 *       404:
 *         description: Cidera not found
 *       500:
 *         description: Failed to delete cidera
 */
router.delete("/:id", verifyToken, checkRole(["admin"]), deleteCidera);

module.exports = router;

