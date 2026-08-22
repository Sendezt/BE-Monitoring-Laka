const { JenisJaminan } = require("../models");

const {
    successResponse,
    errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// GET /api/jenis-jaminan
const getJenisJaminan = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (pageNum - 1) * limitNum;

        const { count, rows } = await JenisJaminan.findAndCountAll({
            limit: limitNum,
            offset: offset,
            where: {
                is_active: true,
            },
            order: [["id", "ASC"]],
        });

        return successResponse(
            res,
            200,
            "Jenis jaminan retrieved successfully",
            rows,
            {
                total: count,
                page: pageNum,
                limit: limitNum,
                total_pages: Math.ceil(count / limitNum),
            }
        );
    } catch (error) {
        logger.error(
            "Get jenis jaminan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to retrieve jenis jaminan"
        );
    }
};

// GET /api/jenis-jaminan/:id
const getJenisJaminanById = async (req, res) => {
    try {
        const { id } = req.params;

        const jenisJaminan =
            await JenisJaminan.findByPk(id);

        if (
            !jenisJaminan ||
            !jenisJaminan.is_active
        ) {
            return errorResponse(
                res,
                404,
                "Jenis jaminan not found"
            );
        }

        return successResponse(
            res,
            200,
            "Jenis jaminan retrieved successfully",
            jenisJaminan
        );
    } catch (error) {
        logger.error(
            "Get jenis jaminan by ID error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to retrieve jenis jaminan"
        );
    }
};

// POST /api/jenis-jaminan
const createJenisJaminan = async (req, res) => {
    try {
        const { nama } = req.body;

        // Validate required field
        if (!nama || !nama.trim()) {
            return errorResponse(
                res,
                400,
                "Nama is required"
            );
        }

        const normalizedNama = nama.trim();

        // Check duplicate
        const existingJenisJaminan =
            await JenisJaminan.findOne({
                where: {
                    nama: normalizedNama,
                },
            });

        if (existingJenisJaminan) {
            if (!existingJenisJaminan.is_active) {
                return errorResponse(
                    res,
                    409,
                    "Jenis jaminan already exists but is inactive"
                );
            }

            return errorResponse(
                res,
                409,
                "Jenis jaminan already exists"
            );
        }

        const jenisJaminan =
            await JenisJaminan.create({
                nama: normalizedNama,
                is_active: true,
            });

        return successResponse(
            res,
            201,
            "Jenis jaminan created successfully",
            jenisJaminan
        );
    } catch (error) {
        logger.error(
            "Create jenis jaminan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to create jenis jaminan"
        );
    }
};

// PUT /api/jenis-jaminan/:id
const updateJenisJaminan = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama } = req.body;

        // Validate required field
        if (!nama || !nama.trim()) {
            return errorResponse(
                res,
                400,
                "Nama is required"
            );
        }

        const jenisJaminan =
            await JenisJaminan.findByPk(id);

        if (
            !jenisJaminan ||
            !jenisJaminan.is_active
        ) {
            return errorResponse(
                res,
                404,
                "Jenis jaminan not found"
            );
        }

        const normalizedNama = nama.trim();

        // Check duplicate
        const existingJenisJaminan =
            await JenisJaminan.findOne({
                where: {
                    nama: normalizedNama,
                },
            });

        if (
            existingJenisJaminan &&
            existingJenisJaminan.id !==
            jenisJaminan.id
        ) {
            return errorResponse(
                res,
                409,
                "Jenis jaminan already exists"
            );
        }

        await jenisJaminan.update({
            nama: normalizedNama,
        });

        return successResponse(
            res,
            200,
            "Jenis jaminan updated successfully",
            jenisJaminan
        );
    } catch (error) {
        logger.error(
            "Update jenis jaminan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to update jenis jaminan"
        );
    }
};

// DELETE /api/jenis-jaminan/:id
const deleteJenisJaminan = async (req, res) => {
    try {
        const { id } = req.params;

        const jenisJaminan =
            await JenisJaminan.findByPk(id);

        if (
            !jenisJaminan ||
            !jenisJaminan.is_active
        ) {
            return errorResponse(
                res,
                404,
                "Jenis jaminan not found"
            );
        }

        // Soft delete
        await jenisJaminan.update({
            is_active: false,
        });

        return successResponse(
            res,
            200,
            "Jenis jaminan deleted successfully",
            null
        );
    } catch (error) {
        logger.error(
            "Delete jenis jaminan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to delete jenis jaminan"
        );
    }
};

module.exports = {
    getJenisJaminan,
    getJenisJaminanById,
    createJenisJaminan,
    updateJenisJaminan,
    deleteJenisJaminan,
};