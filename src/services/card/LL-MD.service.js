const sheets = require("../../config/google");

async function getCards() {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: "Rekap!I46",
  });

  return response.data.values;
}

module.exports = {
  getCards,
};
