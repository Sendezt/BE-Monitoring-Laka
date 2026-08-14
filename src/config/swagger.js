const swaggerJsdoc = require("swagger-jsdoc");

// Determine the server URL dynamically
const getServers = () => {
  const isDevelopment = process.env.NODE_ENV !== "production";

  const servers = [
    {
      url: "http://localhost:3001",
      description: "Development Server",
    },
  ];

  // Add production server if in production environment
  if (!isDevelopment) {
    servers.push({
      url: "https://be-monitoring-laka.vercel.app",
      description: "Production Server",
    });
  }

  return servers;
};

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
    servers: getServers(),
  },
  apis: ["./src/routes/*.js", "./src/routes/**/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
