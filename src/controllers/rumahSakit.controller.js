const { RumahSakit, Wilayah } = require("../models");

const {
    successResponse,
    errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// GET /api/rumah-sakit
const getRumahSakit = async (req, res) => {
    try {
        const { page = 1, limit = 10, wilayah_id } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (pageNum - 1) * limitNum;

        // Build where clause — filter by wilayah_id when provided
        const whereClause = { is_active: true };
        if (wilayah_id) {
            whereClause.wilayah_id = parseInt(wilayah_id, 10);
        }

        const { count, rows } = await RumahSakit.findAndCountAll({
            limit: limitNum,
            offset: offset,
            where: whereClause,
            include: [
                {
                    model: Wilayah,
                    as: "wilayah",
                    attributes: ["id", "nama"],
                },
            ],
            order: [["nama", "ASC"]],
        });

        return successResponse(
            res,
            200,
            "Rumah sakit retrieved successfully",
            rows,
            {
                total: count,
                page: pageNum,
                limit: limitNum,
                total_pages: Math.ceil(count / limitNum),
            }
        );
    } catch (error) {
        logger.error("Get rumah sakit error", error);

        return errorResponse(
            res,
            500,
            "Failed to retrieve rumah sakit"
        );
    }
};

// GET /api/rumah-sakit/:id
const getRumahSakitById = async (req, res) => {
    try {
        const { id } = req.params;

        const rumahSakit = await RumahSakit.findByPk(id, {
            include: [
                {
                    model: Wilayah,
                    as: "wilayah",
                    attributes: ["id", "nama"],
                },
            ],
        });

        if (!rumahSakit || !rumahSakit.is_active) {
            return errorResponse(
                res,
                404,
                "Rumah sakit not found"
            );
        }

        return successResponse(
            res,
            200,
            "Rumah sakit retrieved successfully",
            rumahSakit
        );
    } catch (error) {
        logger.error(
            "Get rumah sakit by ID error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to retrieve rumah sakit"
        );
    }
};

// POST /api/rumah-sakit
const createRumahSakit = async (req, res) => {
    try {
        const {
            nama,
            nama_pic,
            no_hp_pic,
            kode_rumah_sakit,
            wilayah_id,
        } = req.body;

        // Validate required fields
        if (
            !nama ||
            !nama_pic ||
            !no_hp_pic ||
            !kode_rumah_sakit ||
            !wilayah_id
        ) {
            return errorResponse(
                res,
                400,
                "Nama, nama_pic, no_hp_pic, kode_rumah_sakit, and wilayah_id are required"
            );
        }

        const normalizedNama = nama.trim();
        const normalizedNamaPic = nama_pic.trim();
        const normalizedNoHpPic = no_hp_pic.trim();
        const normalizedKode = kode_rumah_sakit.trim();

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

        // Check duplicate kode rumah sakit
        const existingKode = await RumahSakit.findOne({
            where: {
                kode_rumah_sakit: normalizedKode,
            },
        });

        if (existingKode) {
            return errorResponse(
                res,
                409,
                "Kode rumah sakit already exists"
            );
        }

        // Check duplicate nama in same wilayah
        const existingRumahSakit =
            await RumahSakit.findOne({
                where: {
                    nama: normalizedNama,
                    wilayah_id,
                },
            });

        if (existingRumahSakit) {
            if (!existingRumahSakit.is_active) {
                return errorResponse(
                    res,
                    409,
                    "Rumah sakit already exists but is inactive"
                );
            }

            return errorResponse(
                res,
                409,
                "Rumah sakit already exists in this wilayah"
            );
        }

        const rumahSakit = await RumahSakit.create({
            nama: normalizedNama,
            nama_pic: normalizedNamaPic,
            no_hp_pic: normalizedNoHpPic,
            kode_rumah_sakit: normalizedKode,
            wilayah_id,
            is_active: true,
        });

        return successResponse(
            res,
            201,
            "Rumah sakit created successfully",
            rumahSakit
        );
    } catch (error) {
        logger.error(
            "Create rumah sakit error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to create rumah sakit"
        );
    }
};

// PUT /api/rumah-sakit/:id
const updateRumahSakit = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nama,
            nama_pic,
            no_hp_pic,
            kode_rumah_sakit,
            wilayah_id,
        } = req.body;

        // Validate required fields
        if (
            !nama ||
            !nama_pic ||
            !no_hp_pic ||
            !kode_rumah_sakit ||
            !wilayah_id
        ) {
            return errorResponse(
                res,
                400,
                "Nama, nama_pic, no_hp_pic, kode_rumah_sakit, and wilayah_id are required"
            );
        }

        const rumahSakit =
            await RumahSakit.findByPk(id);

        if (
            !rumahSakit ||
            !rumahSakit.is_active
        ) {
            return errorResponse(
                res,
                404,
                "Rumah sakit not found"
            );
        }

        const normalizedNama = nama.trim();
        const normalizedNamaPic = nama_pic.trim();
        const normalizedNoHpPic = no_hp_pic.trim();
        const normalizedKode = kode_rumah_sakit.trim();

        // Check wilayah
        const wilayah = await Wilayah.findByPk(
            wilayah_id
        );

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

        // Check duplicate kode
        const existingKode = await RumahSakit.findOne({
            where: {
                kode_rumah_sakit: normalizedKode,
            },
        });

        if (
            existingKode &&
            existingKode.id !== rumahSakit.id
        ) {
            return errorResponse(
                res,
                409,
                "Kode rumah sakit already exists"
            );
        }

        // Check duplicate nama + wilayah
        const existingRumahSakit =
            await RumahSakit.findOne({
                where: {
                    nama: normalizedNama,
                    wilayah_id,
                },
            });

        if (
            existingRumahSakit &&
            existingRumahSakit.id !== rumahSakit.id
        ) {
            return errorResponse(
                res,
                409,
                "Rumah sakit already exists in this wilayah"
            );
        }

        await rumahSakit.update({
            nama: normalizedNama,
            nama_pic: normalizedNamaPic,
            no_hp_pic: normalizedNoHpPic,
            kode_rumah_sakit: normalizedKode,
            wilayah_id,
        });

        return successResponse(
            res,
            200,
            "Rumah sakit updated successfully",
            rumahSakit
        );
    } catch (error) {
        logger.error(
            "Update rumah sakit error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to update rumah sakit"
        );
    }
};

// DELETE /api/rumah-sakit/:id
const deleteRumahSakit = async (req, res) => {
    try {
        const { id } = req.params;

        const rumahSakit =
            await RumahSakit.findByPk(id);

        if (
            !rumahSakit ||
            !rumahSakit.is_active
        ) {
            return errorResponse(
                res,
                404,
                "Rumah sakit not found"
            );
        }

        // Soft delete
        await rumahSakit.update({
            is_active: false,
        });

        return successResponse(
            res,
            200,
            "Rumah sakit deleted successfully",
            null
        );
    } catch (error) {
        logger.error(
            "Delete rumah sakit error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to delete rumah sakit"
        );
    }
};

module.exports = {
    getRumahSakit,
    getRumahSakitById,
    createRumahSakit,
    updateRumahSakit,
    deleteRumahSakit,
};