const spreadsheetService = require("../../services/card/LPTerlambat1-3.service");

async function getCardLPTerlambat13(req, res) {
  try {
    const cards = await spreadsheetService.getCards();

    res.json({
      success: true,
      data: cards,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to get cards",
    });
  }
}

module.exports = {
  getCardLPTerlambat13,
};
