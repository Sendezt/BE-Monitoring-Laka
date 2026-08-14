const sheets = require("../../config/google");

function normalizePercentage(value) {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const cleaned = String(value)
    .trim()
    .replace(/%/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function getCards() {
  const [firstSheet, percentageSheet] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Rekap!AX46",
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "H17",
    }),
  ]);

  const firstData = firstSheet.data.values || [];
  const rawPercentage = percentageSheet.data.values?.[0]?.[0];

  return {
    data: firstData,
    percentage: normalizePercentage(rawPercentage),
  };
}

module.exports = {
  getCards,
};
