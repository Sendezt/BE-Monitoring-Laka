const { Wilayah } = require("../models");

const {
    successResponse,
    errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// GET /api/wilayah
const getWilayah = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (pageNum - 1) * limitNum;

        const { count, rows } = await Wilayah.findAndCountAll({
            limit: limitNum,
            offset: offset,
            where: {
                is_active: true,
            },
            order: [["nama", "ASC"]],
        });

        return successResponse(
            res,
            200,
            "Wilayah retrieved successfully",
            rows,
            {
                total: count,
                page: pageNum,
                limit: limitNum,
                total_pages: Math.ceil(count / limitNum),
            }
        );
    } catch (error) {
        logger.error("Get wilayah error", error);

        return errorResponse(
            res,
            500,
            "Failed to retrieve wilayah"
        );
    }
};

// GET /api/wilayah/:id
const getWilayahById = async (req, res) => {
    try {
        const { id } = req.params;

        const wilayah = await Wilayah.findByPk(id);

        if (!wilayah || !wilayah.is_active) {
            return errorResponse(
                res,
                404,
                "Wilayah not found"
            );
        }

        return successResponse(
            res,
            200,
            "Wilayah retrieved successfully",
            wilayah
        );
    } catch (error) {
        logger.error("Get wilayah by ID error", error);

        return errorResponse(
            res,
            500,
            "Failed to retrieve wilayah"
        );
    }
};

// POST /api/wilayah
const createWilayah = async (req, res) => {
    try {
        const { nama } = req.body;

        // Validate required field
        if (!nama || !nama.trim()) {
            return errorResponse(
                res,
                400,
                "Nama wilayah is required"
            );
        }

        const normalizedNama = nama.trim();

        // Check existing wilayah
        const existingWilayah = await Wilayah.findOne({
            where: {
                nama: normalizedNama,
            },
        });

        if (existingWilayah) {
            if (!existingWilayah.is_active) {
                return errorResponse(
                    res,
                    409,
                    "Wilayah already exists but is inactive"
                );
            }

            return errorResponse(
                res,
                409,
                "Wilayah already exists"
            );
        }

        const wilayah = await Wilayah.create({
            nama: normalizedNama,
            is_active: true,
        });

        return successResponse(
            res,
            201,
            "Wilayah created successfully",
            wilayah
        );
    } catch (error) {
        logger.error("Create wilayah error", error);

        return errorResponse(
            res,
            500,
            "Failed to create wilayah"
        );
    }
};

// PUT /api/wilayah/:id
const updateWilayah = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama } = req.body;

        if (!nama || !nama.trim()) {
            return errorResponse(
                res,
                400,
                "Nama wilayah is required"
            );
        }

        const wilayah = await Wilayah.findByPk(id);

        if (!wilayah || !wilayah.is_active) {
            return errorResponse(
                res,
                404,
                "Wilayah not found"
            );
        }

        const normalizedNama = nama.trim();

        // Check duplicate name
        const existingWilayah = await Wilayah.findOne({
            where: {
                nama: normalizedNama,
            },
        });

        if (
            existingWilayah &&
            existingWilayah.id !== wilayah.id
        ) {
            return errorResponse(
                res,
                409,
                "Wilayah name already exists"
            );
        }

        await wilayah.update({
            nama: normalizedNama,
        });

        return successResponse(
            res,
            200,
            "Wilayah updated successfully",
            wilayah
        );
    } catch (error) {
        logger.error("Update wilayah error", error);

        return errorResponse(
            res,
            500,
            "Failed to update wilayah"
        );
    }
};

// DELETE /api/wilayah/:id
const deleteWilayah = async (req, res) => {
    try {
        const { id } = req.params;

        const wilayah = await Wilayah.findByPk(id);

        if (!wilayah || !wilayah.is_active) {
            return errorResponse(
                res,
                404,
                "Wilayah not found"
            );
        }

        await wilayah.update({
            is_active: false,
        });

        return successResponse(
            res,
            200,
            "Wilayah deleted successfully",
            null
        );
    } catch (error) {
        logger.error("Delete wilayah error", error);

        return errorResponse(
            res,
            500,
            "Failed to delete wilayah"
        );
    }
};

module.exports = {
    getWilayah,
    getWilayahById,
    createWilayah,
    updateWilayah,
    deleteWilayah,
};