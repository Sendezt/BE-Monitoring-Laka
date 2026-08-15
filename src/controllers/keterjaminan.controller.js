const { Keterjaminan } = require("../models");

const {
    successResponse,
    errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// GET /api/keterjaminan
const getKeterjaminan = async (req, res) => {
    try {
        const keterjaminan = await Keterjaminan.findAll({
            where: {
                is_active: true,
            },
            order: [["nama", "ASC"]],
        });

        return successResponse(
            res,
            200,
            "Keterjaminan retrieved successfully",
            keterjaminan
        );
    } catch (error) {
        logger.error(
            "Get keterjaminan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to retrieve keterjaminan"
        );
    }
};

// GET /api/keterjaminan/:id
const getKeterjaminanById = async (req, res) => {
    try {
        const { id } = req.params;

        const keterjaminan =
            await Keterjaminan.findByPk(id);

        if (
            !keterjaminan ||
            !keterjaminan.is_active
        ) {
            return errorResponse(
                res,
                404,
                "Keterjaminan not found"
            );
        }

        return successResponse(
            res,
            200,
            "Keterjaminan retrieved successfully",
            keterjaminan
        );
    } catch (error) {
        logger.error(
            "Get keterjaminan by ID error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to retrieve keterjaminan"
        );
    }
};

// POST /api/keterjaminan
const createKeterjaminan = async (req, res) => {
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
        const existingKeterjaminan =
            await Keterjaminan.findOne({
                where: {
                    nama: normalizedNama,
                },
            });

        if (existingKeterjaminan) {
            if (!existingKeterjaminan.is_active) {
                return errorResponse(
                    res,
                    409,
                    "Keterjaminan already exists but is inactive"
                );
            }

            return errorResponse(
                res,
                409,
                "Keterjaminan already exists"
            );
        }

        const keterjaminan =
            await Keterjaminan.create({
                nama: normalizedNama,
                is_active: true,
            });

        return successResponse(
            res,
            201,
            "Keterjaminan created successfully",
            keterjaminan
        );
    } catch (error) {
        logger.error(
            "Create keterjaminan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to create keterjaminan"
        );
    }
};

// PUT /api/keterjaminan/:id
const updateKeterjaminan = async (req, res) => {
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

        const keterjaminan =
            await Keterjaminan.findByPk(id);

        if (
            !keterjaminan ||
            !keterjaminan.is_active
        ) {
            return errorResponse(
                res,
                404,
                "Keterjaminan not found"
            );
        }

        const normalizedNama = nama.trim();

        // Check duplicate
        const existingKeterjaminan =
            await Keterjaminan.findOne({
                where: {
                    nama: normalizedNama,
                },
            });

        if (
            existingKeterjaminan &&
            existingKeterjaminan.id !==
            keterjaminan.id
        ) {
            return errorResponse(
                res,
                409,
                "Keterjaminan already exists"
            );
        }

        await keterjaminan.update({
            nama: normalizedNama,
        });

        return successResponse(
            res,
            200,
            "Keterjaminan updated successfully",
            keterjaminan
        );
    } catch (error) {
        logger.error(
            "Update keterjaminan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to update keterjaminan"
        );
    }
};

// DELETE /api/keterjaminan/:id
const deleteKeterjaminan = async (req, res) => {
    try {
        const { id } = req.params;

        const keterjaminan =
            await Keterjaminan.findByPk(id);

        if (
            !keterjaminan ||
            !keterjaminan.is_active
        ) {
            return errorResponse(
                res,
                404,
                "Keterjaminan not found"
            );
        }

        // Soft delete
        await keterjaminan.update({
            is_active: false,
        });

        return successResponse(
            res,
            200,
            "Keterjaminan deleted successfully",
            null
        );
    } catch (error) {
        logger.error(
            "Delete keterjaminan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to delete keterjaminan"
        );
    }
};

module.exports = {
    getKeterjaminan,
    getKeterjaminanById,
    createKeterjaminan,
    updateKeterjaminan,
    deleteKeterjaminan,
};