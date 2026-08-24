// src/middlewares/logging.middleware.js
const logger = require("../utils/logger");

function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  // Cek keberadaan token authorization (tapi jangan log raw token penuh untuk keamanan)
  const authHeader = req.headers["authorization"];
  const authType = authHeader ? (authHeader.startsWith("Bearer ") ? "Bearer" : "Custom") : "None";

  // Log incoming request dengan info tipe auth
  logger.info(`--> ${method} ${originalUrl} [IP: ${ip}] [Auth: ${authType}]`);

  // Intercept ketika response selesai dikirim
  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // Identifikasi siapa yang melakukan request (jika sudah melewati verifyToken)
    let userInfo = "Guest";
    if (req.user) {
      const username = req.user.username || "unknown";
      const role = req.user.role || "unknown";
      userInfo = `${username} (${role})`;
    }

    const logMsg = `<-- ${method} ${originalUrl} ${statusCode} (${duration}ms) [User: ${userInfo}]`;

    if (statusCode >= 500) {
      logger.error(logMsg);
    } else if (statusCode >= 400) {
      logger.warn(logMsg);
    } else {
      logger.info(logMsg);
    }
  });

  next();
}

module.exports = requestLogger;
