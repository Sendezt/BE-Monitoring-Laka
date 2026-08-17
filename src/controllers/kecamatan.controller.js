const { Kecamatan, Polres, Wilayah } = require("../models");

const {
    successResponse,
    errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// GET /api/kecamatan
const getKecamatan = async (req, res) => {
    try {
        const { page = 1, limit = 10, wilayah_id } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (pageNum - 1) * limitNum;

        // Build polres include — filter by wilayah_id when provided
        const polresInclude = {
            model: Polres,
            as: "polres",
            attributes: ["id", "nama", "wilayah_id"],
            include: [
                {
                    model: Wilayah,
                    as: "wilayah",
                    attributes: ["id", "nama"],
                },
            ],
        };
        if (wilayah_id) {
            polresInclude.where = { wilayah_id: parseInt(wilayah_id, 10) };
            polresInclude.required = true;
        }

        const { count, rows } = await Kecamatan.findAndCountAll({
            limit: limitNum,
            offset: offset,
            where: {
                is_active: true,
            },
            include: [polresInclude],
            order: [["nama", "ASC"]],
        });

        return successResponse(
            res,
            200,
            "Kecamatan retrieved successfully",
            rows,
            {
                total: count,
                page: pageNum,
                limit: limitNum,
                total_pages: Math.ceil(count / limitNum),
            }
        );
    } catch (error) {
        logger.error("Get kecamatan error", error);

        return errorResponse(
            res,
            500,
            "Failed to retrieve kecamatan"
        );
    }
};

// GET /api/kecamatan/:id
const getKecamatanById = async (req, res) => {
    try {
        const { id } = req.params;

        const kecamatan = await Kecamatan.findByPk(id, {
            include: [
                {
                    model: Polres,
                    as: "polres",
                    attributes: ["id", "nama", "wilayah_id"],
                    include: [
                        {
                            model: Wilayah,
                            as: "wilayah",
                            attributes: ["id", "nama"],
                        },
                    ],
                },
            ],
        });

        if (!kecamatan || !kecamatan.is_active) {
            return errorResponse(
                res,
                404,
                "Kecamatan not found"
            );
        }

        return successResponse(
            res,
            200,
            "Kecamatan retrieved successfully",
            kecamatan
        );
    } catch (error) {
        logger.error(
            "Get kecamatan by ID error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to retrieve kecamatan"
        );
    }
};

// POST /api/kecamatan
const createKecamatan = async (req, res) => {
    try {
        const { nama, polres_id } = req.body;

        // Validate required fields
        if (!nama || !nama.trim() || !polres_id) {
            return errorResponse(
                res,
                400,
                "Nama and polres_id are required"
            );
        }

        const normalizedNama = nama.trim();

        // Check Polres
        const polres = await Polres.findByPk(polres_id);

        if (!polres) {
            return errorResponse(
                res,
                404,
                "Polres not found"
            );
        }

        // Check Polres status
        if (!polres.is_active) {
            return errorResponse(
                res,
                400,
                "Polres is inactive"
            );
        }

        // Check duplicate
        const existingKecamatan =
            await Kecamatan.findOne({
                where: {
                    nama: normalizedNama,
                    polres_id,
                },
            });

        if (existingKecamatan) {
            if (!existingKecamatan.is_active) {
                return errorResponse(
                    res,
                    409,
                    "Kecamatan already exists but is inactive"
                );
            }

            return errorResponse(
                res,
                409,
                "Kecamatan already exists in this polres"
            );
        }

        const kecamatan = await Kecamatan.create({
            nama: normalizedNama,
            polres_id,
            is_active: true,
        });

        return successResponse(
            res,
            201,
            "Kecamatan created successfully",
            kecamatan
        );
    } catch (error) {
        logger.error(
            "Create kecamatan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to create kecamatan"
        );
    }
};

// PUT /api/kecamatan/:id
const updateKecamatan = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama, polres_id } = req.body;

        // Validate required fields
        if (!nama || !nama.trim() || !polres_id) {
            return errorResponse(
                res,
                400,
                "Nama and polres_id are required"
            );
        }

        const kecamatan =
            await Kecamatan.findByPk(id);

        if (!kecamatan || !kecamatan.is_active) {
            return errorResponse(
                res,
                404,
                "Kecamatan not found"
            );
        }

        const normalizedNama = nama.trim();

        // Check Polres
        const polres = await Polres.findByPk(
            polres_id
        );

        if (!polres) {
            return errorResponse(
                res,
                404,
                "Polres not found"
            );
        }

        if (!polres.is_active) {
            return errorResponse(
                res,
                400,
                "Polres is inactive"
            );
        }

        // Check duplicate
        const existingKecamatan =
            await Kecamatan.findOne({
                where: {
                    nama: normalizedNama,
                    polres_id,
                },
            });

        if (
            existingKecamatan &&
            existingKecamatan.id !== kecamatan.id
        ) {
            return errorResponse(
                res,
                409,
                "Kecamatan already exists in this polres"
            );
        }

        await kecamatan.update({
            nama: normalizedNama,
            polres_id,
        });

        return successResponse(
            res,
            200,
            "Kecamatan updated successfully",
            kecamatan
        );
    } catch (error) {
        logger.error(
            "Update kecamatan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to update kecamatan"
        );
    }
};

// DELETE /api/kecamatan/:id
const deleteKecamatan = async (req, res) => {
    try {
        const { id } = req.params;

        const kecamatan =
            await Kecamatan.findByPk(id);

        if (!kecamatan || !kecamatan.is_active) {
            return errorResponse(
                res,
                404,
                "Kecamatan not found"
            );
        }

        // Soft delete
        await kecamatan.update({
            is_active: false,
        });

        return successResponse(
            res,
            200,
            "Kecamatan deleted successfully",
            null
        );
    } catch (error) {
        logger.error(
            "Delete kecamatan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to delete kecamatan"
        );
    }
};

module.exports = {
    getKecamatan,
    getKecamatanById,
    createKecamatan,
    updateKecamatan,
    deleteKecamatan,
};