const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Monitoring Laka API",
      version: "1.0.0",
      description:
        "API documentation for Monitoring Laka Backend using Google Sheets",
      contact: {
        name: "Monitoring Team",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development Server",
      },
      {
        url: "http://localhost:3000",
        description: "Production Server",
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
