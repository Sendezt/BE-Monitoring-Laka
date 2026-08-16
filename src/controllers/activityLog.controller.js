// src/controllers/activityLog.controller.js
const { Op } = require("sequelize");

const { ActivityLog, User } = require("../models");
const { successResponse, errorResponse } = require("../utils/formatResponse");
const logger = require("../utils/logger");

// GET /api/activity-log
// Query params: user_id, tabel, from, to, page, limit
const getActivityLogs = async (req, res) => {
    try {
        const { user_id, tabel, from, to, page = 1, limit = 20 } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;

        const where = {};

        if (user_id) where.user_id = Number(user_id);
        if (tabel) where.tabel = String(tabel).trim();
        if (from) where.waktu = { ...where.waktu, [Op.gte]: new Date(from) };
        if (to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999); // akhir hari
            where.waktu = { ...where.waktu, [Op.lte]: toDate };
        }

        const { count, rows } = await ActivityLog.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "username", "nama_lengkap", "role"],
                },
            ],
            order: [["waktu", "DESC"]],
            limit: limitNum,
            offset,
            distinct: true,
        });

        return successResponse(
            res,
            200,
            "Activity log retrieved successfully",
            rows,
            {
                total: count,
                page: pageNum,
                limit: limitNum,
                total_pages: Math.ceil(count / limitNum),
            }
        );
    } catch (error) {
        logger.error("Get activity log error", error);
        return errorResponse(res, 500, "Failed to retrieve activity log");
    }
};

module.exports = {
    getActivityLogs,
};
