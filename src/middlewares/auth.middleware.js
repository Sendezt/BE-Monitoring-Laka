// src/middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");

const { errorResponse } = require("../utils/formatResponse");

/**
 * Middleware: Verifikasi JWT Token
 * Decode token dan inject req.user = { id, username, role, wilayah_id }
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return errorResponse(res, 401, "Token tidak ditemukan. Silakan login terlebih dahulu.");
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, username, role, wilayah_id }
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return errorResponse(res, 401, "Token sudah expired. Silakan login kembali.");
        }
        return errorResponse(res, 401, "Token tidak valid atau sudah expired.");
    }
};

/**
 * Middleware: Cek Role (RBAC)
 * @param {string[]} roles - Array role yang diizinkan, contoh: ['admin']
 */
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 401, "Unauthorized. Token diperlukan.");
        }

        if (!roles.includes(req.user.role)) {
            return errorResponse(
                res,
                403,
                "Anda tidak memiliki akses untuk melakukan aksi ini."
            );
        }

        next();
    };
};

module.exports = {
    verifyToken,
    checkRole,
};
