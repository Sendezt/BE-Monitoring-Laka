const { Cidera } = require("../models");

const {
    successResponse,
    errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// GET /api/cidera
const getCidera = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (pageNum - 1) * limitNum;

        const { count, rows } = await Cidera.findAndCountAll({
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
            "Cidera retrieved successfully",
            rows,
            {
                total: count,
                page: pageNum,
                limit: limitNum,
                total_pages: Math.ceil(count / limitNum),
            }
        );
    } catch (error) {
        logger.error("Get cidera error", error);

        return errorResponse(
            res,
            500,
            "Failed to retrieve cidera"
        );
    }
};

// GET /api/cidera/:id
const getCideraById = async (req, res) => {
    try {
        const { id } = req.params;

        const cidera = await Cidera.findByPk(id);

        if (!cidera || !cidera.is_active) {
            return errorResponse(
                res,
                404,
                "Cidera not found"
            );
        }

        return successResponse(
            res,
            200,
            "Cidera retrieved successfully",
            cidera
        );
    } catch (error) {
        logger.error(
            "Get cidera by ID error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to retrieve cidera"
        );
    }
};

// POST /api/cidera
const createCidera = async (req, res) => {
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
        const existingCidera = await Cidera.findOne({
            where: {
                nama: normalizedNama,
            },
        });

        if (existingCidera) {
            if (!existingCidera.is_active) {
                return errorResponse(
                    res,
                    409,
                    "Cidera already exists but is inactive"
                );
            }

            return errorResponse(
                res,
                409,
                "Cidera already exists"
            );
        }

        const cidera = await Cidera.create({
            nama: normalizedNama,
            is_active: true,
        });

        return successResponse(
            res,
            201,
            "Cidera created successfully",
            cidera
        );
    } catch (error) {
        logger.error(
            "Create cidera error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to create cidera"
        );
    }
};

// PUT /api/cidera/:id
const updateCidera = async (req, res) => {
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

        const cidera = await Cidera.findByPk(id);

        if (!cidera || !cidera.is_active) {
            return errorResponse(
                res,
                404,
                "Cidera not found"
            );
        }

        const normalizedNama = nama.trim();

        // Check duplicate
        const existingCidera = await Cidera.findOne({
            where: {
                nama: normalizedNama,
            },
        });

        if (
            existingCidera &&
            existingCidera.id !== cidera.id
        ) {
            return errorResponse(
                res,
                409,
                "Cidera already exists"
            );
        }

        await cidera.update({
            nama: normalizedNama,
        });

        return successResponse(
            res,
            200,
            "Cidera updated successfully",
            cidera
        );
    } catch (error) {
        logger.error(
            "Update cidera error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to update cidera"
        );
    }
};

// DELETE /api/cidera/:id
const deleteCidera = async (req, res) => {
    try {
        const { id } = req.params;

        const cidera = await Cidera.findByPk(id);

        if (!cidera || !cidera.is_active) {
            return errorResponse(
                res,
                404,
                "Cidera not found"
            );
        }

        // Soft delete
        await cidera.update({
            is_active: false,
        });

        return successResponse(
            res,
            200,
            "Cidera deleted successfully",
            null
        );
    } catch (error) {
        logger.error(
            "Delete cidera error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to delete cidera"
        );
    }
};

module.exports = {
    getCidera,
    getCideraById,
    createCidera,
    updateCidera,
    deleteCidera,
};