const {
    Kelurahan,
    Kecamatan,
    Polres,
    Wilayah,
} = require("../models");

const {
    successResponse,
    errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// GET /api/kelurahan
const getKelurahan = async (req, res) => {
    try {
        const kelurahan = await Kelurahan.findAll({
            where: {
                is_active: true,
            },
            include: [
                {
                    model: Kecamatan,
                    as: "kecamatan",
                    attributes: ["id", "nama", "polres_id"],
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
                },
            ],
            order: [["nama", "ASC"]],
        });

        return successResponse(
            res,
            200,
            "Kelurahan retrieved successfully",
            kelurahan
        );
    } catch (error) {
        logger.error("Get kelurahan error", error);

        return errorResponse(
            res,
            500,
            "Failed to retrieve kelurahan"
        );
    }
};

// GET /api/kelurahan/:id
const getKelurahanById = async (req, res) => {
    try {
        const { id } = req.params;

        const kelurahan = await Kelurahan.findByPk(id, {
            include: [
                {
                    model: Kecamatan,
                    as: "kecamatan",
                    attributes: ["id", "nama", "polres_id"],
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
                },
            ],
        });

        if (!kelurahan || !kelurahan.is_active) {
            return errorResponse(
                res,
                404,
                "Kelurahan not found"
            );
        }

        return successResponse(
            res,
            200,
            "Kelurahan retrieved successfully",
            kelurahan
        );
    } catch (error) {
        logger.error(
            "Get kelurahan by ID error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to retrieve kelurahan"
        );
    }
};

// POST /api/kelurahan
const createKelurahan = async (req, res) => {
    try {
        const { nama, kecamatan_id } = req.body;

        // Validate required fields
        if (!nama || !nama.trim() || !kecamatan_id) {
            return errorResponse(
                res,
                400,
                "Nama and kecamatan_id are required"
            );
        }

        const normalizedNama = nama.trim();

        // Check Kecamatan
        const kecamatan = await Kecamatan.findByPk(
            kecamatan_id
        );

        if (!kecamatan) {
            return errorResponse(
                res,
                404,
                "Kecamatan not found"
            );
        }

        // Check Kecamatan status
        if (!kecamatan.is_active) {
            return errorResponse(
                res,
                400,
                "Kecamatan is inactive"
            );
        }

        // Check duplicate
        const existingKelurahan =
            await Kelurahan.findOne({
                where: {
                    nama: normalizedNama,
                    kecamatan_id,
                },
            });

        if (existingKelurahan) {
            if (!existingKelurahan.is_active) {
                return errorResponse(
                    res,
                    409,
                    "Kelurahan already exists but is inactive"
                );
            }

            return errorResponse(
                res,
                409,
                "Kelurahan already exists in this kecamatan"
            );
        }

        const kelurahan = await Kelurahan.create({
            nama: normalizedNama,
            kecamatan_id,
            is_active: true,
        });

        return successResponse(
            res,
            201,
            "Kelurahan created successfully",
            kelurahan
        );
    } catch (error) {
        logger.error(
            "Create kelurahan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to create kelurahan"
        );
    }
};

// PUT /api/kelurahan/:id
const updateKelurahan = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama, kecamatan_id } = req.body;

        // Validate required fields
        if (!nama || !nama.trim() || !kecamatan_id) {
            return errorResponse(
                res,
                400,
                "Nama and kecamatan_id are required"
            );
        }

        const kelurahan =
            await Kelurahan.findByPk(id);

        if (!kelurahan || !kelurahan.is_active) {
            return errorResponse(
                res,
                404,
                "Kelurahan not found"
            );
        }

        const normalizedNama = nama.trim();

        // Check Kecamatan
        const kecamatan = await Kecamatan.findByPk(
            kecamatan_id
        );

        if (!kecamatan) {
            return errorResponse(
                res,
                404,
                "Kecamatan not found"
            );
        }

        if (!kecamatan.is_active) {
            return errorResponse(
                res,
                400,
                "Kecamatan is inactive"
            );
        }

        // Check duplicate
        const existingKelurahan =
            await Kelurahan.findOne({
                where: {
                    nama: normalizedNama,
                    kecamatan_id,
                },
            });

        if (
            existingKelurahan &&
            existingKelurahan.id !== kelurahan.id
        ) {
            return errorResponse(
                res,
                409,
                "Kelurahan already exists in this kecamatan"
            );
        }

        await kelurahan.update({
            nama: normalizedNama,
            kecamatan_id,
        });

        return successResponse(
            res,
            200,
            "Kelurahan updated successfully",
            kelurahan
        );
    } catch (error) {
        logger.error(
            "Update kelurahan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to update kelurahan"
        );
    }
};

// DELETE /api/kelurahan/:id
const deleteKelurahan = async (req, res) => {
    try {
        const { id } = req.params;

        const kelurahan =
            await Kelurahan.findByPk(id);

        if (!kelurahan || !kelurahan.is_active) {
            return errorResponse(
                res,
                404,
                "Kelurahan not found"
            );
        }

        // Soft delete
        await kelurahan.update({
            is_active: false,
        });

        return successResponse(
            res,
            200,
            "Kelurahan deleted successfully",
            null
        );
    } catch (error) {
        logger.error(
            "Delete kelurahan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to delete kelurahan"
        );
    }
};

module.exports = {
    getKelurahan,
    getKelurahanById,
    createKelurahan,
    updateKelurahan,
    deleteKelurahan,
};