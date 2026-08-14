require("dotenv").config();

const express = require("express");
const cors = require("cors");

const cardRoutes = require("./routes/card.route");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Spreadsheet API is running",
  });
});

app.use("/api", cardRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
