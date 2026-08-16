const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Wilayah = require("../models/Wilayah");
const ActivityLog = require("../models/ActivityLog");

const {
    successResponse,
    errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate request
        if (!username || !password) {
            return errorResponse(
                res,
                400,
                "Username and password are required",
            );
        }

        // Find user
        const user = await User.findOne({
            where: { username },
            include: [
                {
                    model: Wilayah,
                    as: "wilayah",
                    attributes: ["id", "nama"],
                },
            ],
        });

        if (!user) {
            return errorResponse(
                res,
                401,
                "Invalid username or password",
            );
        }

        // Check user status
        if (!user.is_active) {
            return errorResponse(
                res,
                403,
                "User account is inactive",
            );
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password,
        );

        if (!isPasswordValid) {
            return errorResponse(
                res,
                401,
                "Invalid username or password",
            );
        }

        // Create JWT payload
        const payload = {
            id: user.id,
            username: user.username,
            role: user.role,
            wilayah_id: user.wilayah_id,
        };

        // Generate JWT
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d",
            },
        );

        // Catat aktivitas login
        await ActivityLog.create({
            aksi: "LOGIN",
            tabel: "users",
            record_id: user.id,
            user_id: user.id,
            ip_address: req.ip || req.connection.remoteAddress,
        });

        return successResponse(
            res,
            200,
            "Login successful",
            {
                token,
                user: {
                    username: user.username,
                    nama_lengkap: user.nama_lengkap,
                    role: user.role,
                    wilayah_id: user.wilayah_id,
                    wilayah: user.wilayah,
                },
            },
        );
    } catch (error) {
        logger.error("Login error", error);

        return errorResponse(
            res,
            500,
            "Failed to login",
        );
    }
};

module.exports = {
    login,
};