require("dotenv").config();

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");

const cardRoutes = require("./routes/card.route");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Spreadsheet API is running",
  });
});

// Swagger documentation options
const swaggerOptions = {
  swaggerOptions: {
    url: "/swagger.json",
  },
  customCss: ".swagger-ui { background-color: #fafafa; }",
  customSiteTitle: "Monitoring Laka API Documentation",
};

// Serve swagger.json
app.get("/swagger.json", (req, res) => {
  res.json(swaggerSpecs);
});

// Swagger documentation endpoint
app.use(
  "/api-test",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, swaggerOptions),
);

app.use("/api", cardRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
