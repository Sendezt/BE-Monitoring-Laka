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
    components: {
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },

            username: {
              type: "string",
              example: "admin",
            },

            nama_lengkap: {
              type: "string",
              example: "Admin Monitoring",
            },

            role: {
              type: "string",
              example: "admin",
            },

            wilayah_id: {
              type: "integer",
              example: 1,
            },

            is_active: {
              type: "boolean",
              example: true,
            },

            created_at: {
              type: "string",
              format: "date-time",
              example: "2026-08-15T00:00:00.000Z",
            },

            updated_at: {
              type: "string",
              format: "date-time",
              example: "2026-08-15T00:00:00.000Z",
            },
          },
        },

        CreateUser: {
          type: "object",
          required: [
            "username",
            "nama_lengkap",
            "password",
            "role",
            "wilayah_id",
          ],
          properties: {
            username: {
              type: "string",
              example: "admin",
            },

            nama_lengkap: {
              type: "string",
              example: "Admin Monitoring",
            },

            password: {
              type: "string",
              example: "password123",
            },

            role: {
              type: "string",
              example: "admin",
            },

            wilayah_id: {
              type: "integer",
              example: 1,
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js", "./src/routes/**/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
