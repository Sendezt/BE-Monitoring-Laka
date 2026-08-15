// src/app.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const logger = require("./utils/logger");
const swaggerSpecs = require("./config/swagger");
const sequelize = require("./config/database");
const User = require("./models/User");

const cardRoutes = require("./routes/card.route");
const userRoutes = require("./routes/user.route");
const authRoutes = require("./routes/auth.route");
const wilayahRoutes = require("./routes/wilayah.route");
const polresRoutes = require("./routes/polres.route");
const rumahSakitRoutes = require("./routes/rumahsakit.route");
const kecamatanRoutes = require("./routes/kecamatan.route");
const kelurahanRoutes = require("./routes/kelurahan.route");
const profesiRoutes = require("./routes/profesi.route");
const tindakLanjutRoutes = require("./routes/tindaklanjut.route");
const cideraRoutes = require("./routes/cidera.route");
const keterjaminanRoutes = require("./routes/keterjaminan.route");
const sifatLakaRoutes = require("./routes/sifatLaka.route");
const jenisKendaraanRoutes = require("./routes/jenisKendaraan.route");
const kasusTabrakKecelakaanRoutes = require("./routes/kasustabrakkecelakaan.route");
const faktorPenyebabLakaRoutes = require("./routes/faktorpenyebablaka.route");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Spreadsheet API is running",
  });
});

// Serve swagger.json
app.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json(swaggerSpecs);
});

// Swagger UI with CDN
app.get("/api-test", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Monitoring Laka API Documentation</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css">
        <style>
          html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
          }

          *, *:before, *:after {
            box-sizing: inherit;
          }

          body {
            margin: 0;
            padding: 0;
          }
        </style>
      </head>

      <body>
        <div id="swagger-ui"></div>

        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-standalone-preset.js"></script>

        <script>
          const ui = SwaggerUIBundle({
            url: "/swagger.json",
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout"
          });

          window.onload = function() {
            window.ui = ui;
          };
        </script>
      </body>
    </html>
  `);
});

// Routes
app.use("/api/card", cardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/wilayah", wilayahRoutes)
app.use("/api/polres", polresRoutes)
app.use("/api/rumahsakit", rumahSakitRoutes);
app.use("/api/kecamatan", kecamatanRoutes);
app.use("/api/kelurahan", kelurahanRoutes);
app.use("/api/profesi", profesiRoutes);
app.use("/api/tindak-lanjut", tindakLanjutRoutes);
app.use("/api/cidera", cideraRoutes);
app.use("/api/keterjaminan", keterjaminanRoutes);
app.use("/api/sifat-laka", sifatLakaRoutes);
app.use("/api/jenis-kendaraan", jenisKendaraanRoutes);
app.use("/api/kasus-tabrak-kecelakaan", kasusTabrakKecelakaanRoutes);
app.use("/api/faktor-penyebab-laka", faktorPenyebabLakaRoutes);

const PORT = process.env.PORT || 3001;

// Start server + database connection
async function startServer() {
  try {
    await sequelize.authenticate();

    logger.info("MySQL database connected successfully");

    await sequelize.sync();

    logger.info("Database tables synchronized successfully");

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Unable to start server", error);
  }
}

startServer();
