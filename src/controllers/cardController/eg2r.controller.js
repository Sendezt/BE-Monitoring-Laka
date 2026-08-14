const spreadsheetService = require("../../services/card/eg2r.service");

async function getCardEG2R(req, res) {
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
  getCardEG2R,
};
