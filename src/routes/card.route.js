const express = require("express");
const router = express.Router();

const { getCards } = require("../controllers/card.controller");

router.get("/card", getCards);

module.exports = router;
