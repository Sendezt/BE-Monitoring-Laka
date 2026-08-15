const express = require("express");

const {
    login,
} = require("../controllers/auth.contoller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate a user with username and password, returns a JWT token on success.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       type: object
 *                       properties:
 *                         username:
 *                           type: string
 *                           example: admin
 *                         nama_lengkap:
 *                           type: string
 *                           example: Admin Monitoring
 *                         role:
 *                           type: string
 *                           example: admin
 *                         wilayah_id:
 *                           type: integer
 *                           example: 1
 *                         wilayah:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 1
 *                             nama:
 *                               type: string
 *                               example: Jawa Tengah
 *       400:
 *         description: Username and password are required
 *       401:
 *         description: Invalid username or password
 *       403:
 *         description: User account is inactive
 *       500:
 *         description: Failed to login
 */
router.post("/login", login);

module.exports = router;