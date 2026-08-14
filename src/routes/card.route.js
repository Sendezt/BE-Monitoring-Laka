const express = require("express");
const router = express.Router();

const {
  getCardTotalLaporanPolisi,
} = require("../controllers/cardController/totalLaporanPolisi.controller");
const {
  getCardLakaTunggal,
} = require("../controllers/cardController/lakaTunggal.controller");
const {
  getCardJumlahKorban,
} = require("../controllers/cardController/jumlahKorban.controller");
const {
  getCardLukaLuka,
} = require("../controllers/cardController/lukaLuka.controller");
const {
  getCardLLMD,
} = require("../controllers/cardController/LL-MD.controller");
const {
  getCardMeninggalDunia,
} = require("../controllers/cardController/meninggalDunia.controller");
const {
  getCardLPTerlambat,
} = require("../controllers/cardController/LPTerlambat.controller");
const {
  getCardLPTerlambat13,
} = require("../controllers/cardController/LPTerlambat1-3.controller");
const {
  getCardLPTerlambat47,
} = require("../controllers/cardController/LPTerlambat4-7.controller");
const {
  getCardLPTerlambatLebih7,
} = require("../controllers/cardController/LPTerlambatlebih7.controller");
const {
  getCardLPNormal,
} = require("../controllers/cardController/LPNormal.controller");
const {
  getCardTerjamin,
} = require("../controllers/cardController/terjamin.controller");
const {
  getCardTidakTerjamin,
} = require("../controllers/cardController/tidakTerjamin.controller");
const {
  getCardEG2R,
} = require("../controllers/cardController/eg2r.controller");

/**
 * @swagger
 * /api/card/totalLaporanPolisi:
 *   get:
 *     summary: Get data card total laporan polisi
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
 *     summary: Get data card laka tunggal
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

/**
 * @swagger
 * /api/card/jumlahKorban:
 *   get:
 *     summary: Get data card jumlah korban
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
router.get("/jumlahKorban", getCardJumlahKorban);

/**
 * @swagger
 * /api/card/lukaLuka:
 *   get:
 *     summary: Get data card Luka Luka
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
router.get("/lukaLuka", getCardLukaLuka);

/**
 * @swagger
 * /api/card/llmd:
 *   get:
 *     summary: Get data card Luka Luka dan Meninggal Dunia
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
router.get("/llmd", getCardLLMD);

/**
 * @swagger
 * /api/card/meninggaldunia:
 *   get:
 *     summary: Get data card Meninggal Dunia
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
router.get("/meninggaldunia", getCardMeninggalDunia);

/**
 * @swagger
 * /api/card/lpterlambat:
 *   get:
 *     summary: Get data card Laporan Polisi Terlambat Lapor
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
router.get("/lpterlambat", getCardLPTerlambat);

/**
 * @swagger
 * /api/card/lpterlambat13:
 *   get:
 *     summary: Get data card Laporan Polisi Terlambat Lapor periode 1-3 hari
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
router.get("/lpterlambat13", getCardLPTerlambat13);

/**
 * @swagger
 * /api/card/lpterlambat47:
 *   get:
 *     summary: Get data card Laporan Polisi Terlambat Lapor periode 4-7 hari
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
router.get("/lpterlambat47", getCardLPTerlambat47);

/**
 * @swagger
 * /api/card/lpterlambatlebih7:
 *   get:
 *     summary: Get data card Laporan Polisi Terlambat Lapor periode lebih dari 7 hari
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
router.get("/lpterlambatlebih7", getCardLPTerlambatLebih7);

/**
 * @swagger
 * /api/card/lpnormal:
 *   get:
 *     summary: Get data card Laporan Polisi Terlambat Lapor normal(tidak terlambat)
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
router.get("/lpnormal", getCardLPNormal);

/**
 * @swagger
 * /api/card/terjamin:
 *   get:
 *     summary: Get data card Laporan Terjamin
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
router.get("/terjamin", getCardTerjamin);

/**
 * @swagger
 * /api/card/tidakterjamin:
 *   get:
 *     summary: Get data card Laporan Tidak Terjamin
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
router.get("/tidakterjamin", getCardTidakTerjamin);

/**
 * @swagger
 * /api/card/eg2r:
 *   get:
 *     summary: Get data card EG2R
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
router.get("/eg2r", getCardEG2R);

module.exports = router;
