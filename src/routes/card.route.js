const express = require("express");
const router = express.Router();

const {
  getCardTotalLaporanPolisi,
} = require("../controllers/cardController/totalLaporanPolisi.controller");
const {
  getCardLakaTunggal,
} = require("../controllers/cardController/lakaTunggal.controller");

/**
 * @swagger
 * /api/card/totalLaporanPolisi:
 *   get:
 *     summary: Get all cards from Google Sheets
 *     description: Retrieve all card data from the connected Google Sheets spreadsheet
 *     tags:
 *       - Cards
 *     responses:
 *       200:
 *         description: Successfully retrieved cards
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *       500:
 *         description: Failed to retrieve cards
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get cards"
 */
router.get("/totalLaporanPolisi", getCardTotalLaporanPolisi);

/**
 * @swagger
 * /api/card/lakaTunggal:
 *   get:
 *     summary: Get all cards from Google Sheets
 *     description: Retrieve all card data from the connected Google Sheets spreadsheet
 *     tags:
 *       - Cards
 *     responses:
 *       200:
 *         description: Successfully retrieved cards
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *       500:
 *         description: Failed to retrieve cards
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get cards"
 */
router.get("/lakaTunggal", getCardLakaTunggal);

module.exports = router;
