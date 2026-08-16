const { Profesi } = require("../models");

const {
    successResponse,
    errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// GET /api/profesi
const getProfesi = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (pageNum - 1) * limitNum;

        const { count, rows } = await Profesi.findAndCountAll({
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
            "Profesi retrieved successfully",
            rows,
            {
                total: count,
                page: pageNum,
                limit: limitNum,
                total_pages: Math.ceil(count / limitNum),
            }
        );
    } catch (error) {
        logger.error("Get profesi error", error);

        return errorResponse(
            res,
            500,
            "Failed to retrieve profesi"
        );
    }
};

// GET /api/profesi/:id
const getProfesiById = async (req, res) => {
    try {
        const { id } = req.params;

        const profesi = await Profesi.findByPk(id);

        if (!profesi || !profesi.is_active) {
            return errorResponse(
                res,
                404,
                "Profesi not found"
            );
        }

        return successResponse(
            res,
            200,
            "Profesi retrieved successfully",
            profesi
        );
    } catch (error) {
        logger.error(
            "Get profesi by ID error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to retrieve profesi"
        );
    }
};

// POST /api/profesi
const createProfesi = async (req, res) => {
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
        const existingProfesi = await Profesi.findOne({
            where: {
                nama: normalizedNama,
            },
        });

        if (existingProfesi) {
            if (!existingProfesi.is_active) {
                return errorResponse(
                    res,
                    409,
                    "Profesi already exists but is inactive"
                );
            }

            return errorResponse(
                res,
                409,
                "Profesi already exists"
            );
        }

        const profesi = await Profesi.create({
            nama: normalizedNama,
            is_active: true,
        });

        return successResponse(
            res,
            201,
            "Profesi created successfully",
            profesi
        );
    } catch (error) {
        logger.error(
            "Create profesi error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to create profesi"
        );
    }
};

// PUT /api/profesi/:id
const updateProfesi = async (req, res) => {
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

        const profesi = await Profesi.findByPk(id);

        if (!profesi || !profesi.is_active) {
            return errorResponse(
                res,
                404,
                "Profesi not found"
            );
        }

        const normalizedNama = nama.trim();

        // Check duplicate
        const existingProfesi = await Profesi.findOne({
            where: {
                nama: normalizedNama,
            },
        });

        if (
            existingProfesi &&
            existingProfesi.id !== profesi.id
        ) {
            return errorResponse(
                res,
                409,
                "Profesi already exists"
            );
        }

        await profesi.update({
            nama: normalizedNama,
        });

        return successResponse(
            res,
            200,
            "Profesi updated successfully",
            profesi
        );
    } catch (error) {
        logger.error(
            "Update profesi error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to update profesi"
        );
    }
};

// DELETE /api/profesi/:id
const deleteProfesi = async (req, res) => {
    try {
        const { id } = req.params;

        const profesi = await Profesi.findByPk(id);

        if (!profesi || !profesi.is_active) {
            return errorResponse(
                res,
                404,
                "Profesi not found"
            );
        }

        // Soft delete
        await profesi.update({
            is_active: false,
        });

        return successResponse(
            res,
            200,
            "Profesi deleted successfully",
            null
        );
    } catch (error) {
        logger.error(
            "Delete profesi error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to delete profesi"
        );
    }
};

module.exports = {
    getProfesi,
    getProfesiById,
    createProfesi,
    updateProfesi,
    deleteProfesi,
};