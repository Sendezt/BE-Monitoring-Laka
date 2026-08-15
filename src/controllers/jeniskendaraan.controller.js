const { JenisKendaraan } = require("../models");

const {
    successResponse,
    errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// GET /api/jenis-kendaraan
const getJenisKendaraan = async (req, res) => {
    try {
        const jenisKendaraan = await JenisKendaraan.findAll({
            where: {
                is_active: true,
            },
            order: [["nama", "ASC"]],
        });

        return successResponse(
            res,
            200,
            "Jenis kendaraan retrieved successfully",
            jenisKendaraan
        );
    } catch (error) {
        logger.error(
            "Get jenis kendaraan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to retrieve jenis kendaraan"
        );
    }
};

// GET /api/jenis-kendaraan/:id
const getJenisKendaraanById = async (req, res) => {
    try {
        const { id } = req.params;

        const jenisKendaraan =
            await JenisKendaraan.findByPk(id);

        if (
            !jenisKendaraan ||
            !jenisKendaraan.is_active
        ) {
            return errorResponse(
                res,
                404,
                "Jenis kendaraan not found"
            );
        }

        return successResponse(
            res,
            200,
            "Jenis kendaraan retrieved successfully",
            jenisKendaraan
        );
    } catch (error) {
        logger.error(
            "Get jenis kendaraan by ID error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to retrieve jenis kendaraan"
        );
    }
};

// POST /api/jenis-kendaraan
const createJenisKendaraan = async (req, res) => {
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
        const existingJenisKendaraan =
            await JenisKendaraan.findOne({
                where: {
                    nama: normalizedNama,
                },
            });

        if (existingJenisKendaraan) {
            if (!existingJenisKendaraan.is_active) {
                return errorResponse(
                    res,
                    409,
                    "Jenis kendaraan already exists but is inactive"
                );
            }

            return errorResponse(
                res,
                409,
                "Jenis kendaraan already exists"
            );
        }

        const jenisKendaraan =
            await JenisKendaraan.create({
                nama: normalizedNama,
                is_active: true,
            });

        return successResponse(
            res,
            201,
            "Jenis kendaraan created successfully",
            jenisKendaraan
        );
    } catch (error) {
        logger.error(
            "Create jenis kendaraan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to create jenis kendaraan"
        );
    }
};

// PUT /api/jenis-kendaraan/:id
const updateJenisKendaraan = async (req, res) => {
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

        const jenisKendaraan =
            await JenisKendaraan.findByPk(id);

        if (
            !jenisKendaraan ||
            !jenisKendaraan.is_active
        ) {
            return errorResponse(
                res,
                404,
                "Jenis kendaraan not found"
            );
        }

        const normalizedNama = nama.trim();

        // Check duplicate
        const existingJenisKendaraan =
            await JenisKendaraan.findOne({
                where: {
                    nama: normalizedNama,
                },
            });

        if (
            existingJenisKendaraan &&
            existingJenisKendaraan.id !==
            jenisKendaraan.id
        ) {
            return errorResponse(
                res,
                409,
                "Jenis kendaraan already exists"
            );
        }

        await jenisKendaraan.update({
            nama: normalizedNama,
        });

        return successResponse(
            res,
            200,
            "Jenis kendaraan updated successfully",
            jenisKendaraan
        );
    } catch (error) {
        logger.error(
            "Update jenis kendaraan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to update jenis kendaraan"
        );
    }
};

// DELETE /api/jenis-kendaraan/:id
const deleteJenisKendaraan = async (req, res) => {
    try {
        const { id } = req.params;

        const jenisKendaraan =
            await JenisKendaraan.findByPk(id);

        if (
            !jenisKendaraan ||
            !jenisKendaraan.is_active
        ) {
            return errorResponse(
                res,
                404,
                "Jenis kendaraan not found"
            );
        }

        // Soft delete
        await jenisKendaraan.update({
            is_active: false,
        });

        return successResponse(
            res,
            200,
            "Jenis kendaraan deleted successfully",
            null
        );
    } catch (error) {
        logger.error(
            "Delete jenis kendaraan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to delete jenis kendaraan"
        );
    }
};

module.exports = {
    getJenisKendaraan,
    getJenisKendaraanById,
    createJenisKendaraan,
    updateJenisKendaraan,
    deleteJenisKendaraan,
};