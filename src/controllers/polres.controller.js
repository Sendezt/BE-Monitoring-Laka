const { Polres, Wilayah } = require("../models");

const {
    successResponse,
    errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// GET /api/polres
const getPolres = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (pageNum - 1) * limitNum;

        const { count, rows } = await Polres.findAndCountAll({
            limit: limitNum,
            offset: offset,
            where: {
                is_active: true,
            },
            include: [
                {
                    model: Wilayah,
                    as: "wilayah",
                    attributes: ["id", "nama"],
                },
            ],
            order: [["id", "ASC"]],
        });

        return successResponse(
            res,
            200,
            "Polres retrieved successfully",
            rows,
            {
                total: count,
                page: pageNum,
                limit: limitNum,
                total_pages: Math.ceil(count / limitNum),
            }
        );
    } catch (error) {
        logger.error("Get polres error", error);

        return errorResponse(
            res,
            500,
            "Failed to retrieve polres"
        );
    }
};

// GET /api/polres/:id
const getPolresById = async (req, res) => {
    try {
        const { id } = req.params;

        const polres = await Polres.findByPk(id, {
            include: [
                {
                    model: Wilayah,
                    as: "wilayah",
                    attributes: ["id", "nama"],
                },
            ],
        });

        if (!polres || !polres.is_active) {
            return errorResponse(
                res,
                404,
                "Polres not found"
            );
        }

        return successResponse(
            res,
            200,
            "Polres retrieved successfully",
            polres
        );
    } catch (error) {
        logger.error("Get polres by ID error", error);

        return errorResponse(
            res,
            500,
            "Failed to retrieve polres"
        );
    }
};

// POST /api/polres
const createPolres = async (req, res) => {
    try {
        const { nama, wilayah_id } = req.body;

        // Validate required fields
        if (!nama || !nama.trim() || !wilayah_id) {
            return errorResponse(
                res,
                400,
                "Nama and wilayah_id are required"
            );
        }

        const normalizedNama = nama.trim();

        // Check wilayah
        const wilayah = await Wilayah.findByPk(wilayah_id);

        if (!wilayah) {
            return errorResponse(
                res,
                404,
                "Wilayah not found"
            );
        }

        // Check wilayah status
        if (!wilayah.is_active) {
            return errorResponse(
                res,
                400,
                "Wilayah is inactive"
            );
        }

        // Check duplicate polres
        const existingPolres = await Polres.findOne({
            where: {
                nama: normalizedNama,
                wilayah_id,
            },
        });

        if (existingPolres) {
            if (!existingPolres.is_active) {
                return errorResponse(
                    res,
                    409,
                    "Polres already exists but is inactive"
                );
            }

            return errorResponse(
                res,
                409,
                "Polres already exists in this wilayah"
            );
        }

        const polres = await Polres.create({
            nama: normalizedNama,
            wilayah_id,
            is_active: true,
        });

        return successResponse(
            res,
            201,
            "Polres created successfully",
            polres
        );
    } catch (error) {
        logger.error("Create polres error", error);

        return errorResponse(
            res,
            500,
            "Failed to create polres"
        );
    }
};

// PUT /api/polres/:id
const updatePolres = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama, wilayah_id } = req.body;

        // Validate required fields
        if (!nama || !nama.trim() || !wilayah_id) {
            return errorResponse(
                res,
                400,
                "Nama and wilayah_id are required"
            );
        }

        const polres = await Polres.findByPk(id);

        if (!polres || !polres.is_active) {
            return errorResponse(
                res,
                404,
                "Polres not found"
            );
        }

        const normalizedNama = nama.trim();

        // Check wilayah
        const wilayah = await Wilayah.findByPk(wilayah_id);

        if (!wilayah) {
            return errorResponse(
                res,
                404,
                "Wilayah not found"
            );
        }

        if (!wilayah.is_active) {
            return errorResponse(
                res,
                400,
                "Wilayah is inactive"
            );
        }

        // Check duplicate
        const existingPolres = await Polres.findOne({
            where: {
                nama: normalizedNama,
                wilayah_id,
            },
        });

        if (
            existingPolres &&
            existingPolres.id !== polres.id
        ) {
            return errorResponse(
                res,
                409,
                "Polres already exists in this wilayah"
            );
        }

        await polres.update({
            nama: normalizedNama,
            wilayah_id,
        });

        return successResponse(
            res,
            200,
            "Polres updated successfully",
            polres
        );
    } catch (error) {
        logger.error("Update polres error", error);

        return errorResponse(
            res,
            500,
            "Failed to update polres"
        );
    }
};

// DELETE /api/polres/:id
const deletePolres = async (req, res) => {
    try {
        const { id } = req.params;

        const polres = await Polres.findByPk(id);

        if (!polres || !polres.is_active) {
            return errorResponse(
                res,
                404,
                "Polres not found"
            );
        }

        // Soft delete
        await polres.update({
            is_active: false,
        });

        return successResponse(
            res,
            200,
            "Polres deleted successfully",
            null
        );
    } catch (error) {
        logger.error("Delete polres error", error);

        return errorResponse(
            res,
            500,
            "Failed to delete polres"
        );
    }
};

// GET /api/polres/wilayah/:wilayah_id
const getPolresByWilayahId = async (req, res) => {
    try {
        const { wilayah_id } = req.params;

        // Validate wilayah exists
        const wilayah = await Wilayah.findByPk(wilayah_id);

        if (!wilayah || !wilayah.is_active) {
            return errorResponse(
                res,
                404,
                "Wilayah not found"
            );
        }

        const { page = 1, limit = 10 } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (pageNum - 1) * limitNum;

        const { count, rows } = await Polres.findAndCountAll({
            limit: limitNum,
            offset: offset,
            where: {
                wilayah_id,
                is_active: true,
            },
            include: [
                {
                    model: Wilayah,
                    as: "wilayah",
                    attributes: ["id", "nama"],
                },
            ],
            order: [["id", "ASC"]],
        });

        return successResponse(
            res,
            200,
            "Polres retrieved successfully",
            rows,
            {
                total: count,
                page: pageNum,
                limit: limitNum,
                total_pages: Math.ceil(count / limitNum),
            }
        );
    } catch (error) {
        logger.error("Get polres by wilayah ID error", error);

        return errorResponse(
            res,
            500,
            "Failed to retrieve polres"
        );
    }
};

module.exports = {
    getPolres,
    getPolresById,
    getPolresByWilayahId,
    createPolres,
    updatePolres,
    deletePolres,
};