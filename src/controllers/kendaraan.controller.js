const {
    Kendaraan,
    LaporanPolisi,
    JenisKendaraan,
} = require("../models");

const {
    successResponse,
    errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// GET /api/kendaraan
const getKendaraan = async (req, res) => {
    try {
        const kendaraan = await Kendaraan.findAll({
            where: {
                is_active: true,
            },

            include: [
                {
                    model: LaporanPolisi,
                    as: "laporanPolisi",
                    attributes: ["id", "no_lp"],
                },
                {
                    model: JenisKendaraan,
                    as: "jenisKendaraan",
                    attributes: ["id", "nama"],
                },
            ],

            order: [["id", "DESC"]],
        });

        return successResponse(
            res,
            200,
            "Kendaraan retrieved successfully",
            kendaraan
        );
    } catch (error) {
        logger.error(
            "Get kendaraan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to retrieve kendaraan"
        );
    }
};

// GET /api/kendaraan/:id
const getKendaraanById = async (req, res) => {
    try {
        const { id } = req.params;

        const kendaraan = await Kendaraan.findByPk(id, {
            include: [
                {
                    model: LaporanPolisi,
                    as: "laporanPolisi",
                    attributes: ["id", "no_lp"],
                },
                {
                    model: JenisKendaraan,
                    as: "jenisKendaraan",
                    attributes: ["id", "nama"],
                },
            ],
        });

        if (!kendaraan || !kendaraan.is_active) {
            return errorResponse(
                res,
                404,
                "Kendaraan not found"
            );
        }

        return successResponse(
            res,
            200,
            "Kendaraan retrieved successfully",
            kendaraan
        );
    } catch (error) {
        logger.error(
            "Get kendaraan by ID error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to retrieve kendaraan"
        );
    }
};

// POST /api/kendaraan
const createKendaraan = async (req, res) => {
    try {
        const {
            laporan_polisi_id,
            peran,
            jenis_kendaraan_id,
            nopol,
            masa_laku_sw,
        } = req.body;

        // Required fields
        if (
            !laporan_polisi_id ||
            !peran ||
            !jenis_kendaraan_id ||
            !nopol
        ) {
            return errorResponse(
                res,
                400,
                "laporan_polisi_id, peran, jenis_kendaraan_id, and nopol are required"
            );
        }

        // Validate peran
        if (!["korban", "penjamin"].includes(peran)) {
            return errorResponse(
                res,
                400,
                "Peran must be either korban or penjamin"
            );
        }

        // Check laporan polisi
        const laporanPolisi =
            await LaporanPolisi.findByPk(
                laporan_polisi_id
            );

        if (
            !laporanPolisi ||
            !laporanPolisi.is_active
        ) {
            return errorResponse(
                res,
                404,
                "Laporan polisi not found"
            );
        }

        // Check jenis kendaraan
        const jenisKendaraan =
            await JenisKendaraan.findByPk(
                jenis_kendaraan_id
            );

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

        const kendaraan = await Kendaraan.create({
            laporan_polisi_id,
            peran,
            jenis_kendaraan_id,
            nopol: nopol.trim(),
            masa_laku_sw: masa_laku_sw ?? null,
            is_active: true,
        });

        return successResponse(
            res,
            201,
            "Kendaraan created successfully",
            kendaraan
        );
    } catch (error) {
        logger.error(
            "Create kendaraan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to create kendaraan"
        );
    }
};

// PUT /api/kendaraan/:id
const updateKendaraan = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            laporan_polisi_id,
            peran,
            jenis_kendaraan_id,
            nopol,
            masa_laku_sw,
        } = req.body;

        const kendaraan =
            await Kendaraan.findByPk(id);

        if (!kendaraan || !kendaraan.is_active) {
            return errorResponse(
                res,
                404,
                "Kendaraan not found"
            );
        }

        // Validate peran
        if (
            peran !== undefined &&
            !["korban", "penjamin"].includes(peran)
        ) {
            return errorResponse(
                res,
                400,
                "Peran must be either korban or penjamin"
            );
        }

        // Check laporan polisi
        if (laporan_polisi_id !== undefined) {
            const laporanPolisi =
                await LaporanPolisi.findByPk(
                    laporan_polisi_id
                );

            if (
                !laporanPolisi ||
                !laporanPolisi.is_active
            ) {
                return errorResponse(
                    res,
                    404,
                    "Laporan polisi not found"
                );
            }
        }

        // Check jenis kendaraan
        if (jenis_kendaraan_id !== undefined) {
            const jenisKendaraan =
                await JenisKendaraan.findByPk(
                    jenis_kendaraan_id
                );

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
        }

        await kendaraan.update({
            laporan_polisi_id:
                laporan_polisi_id !== undefined
                    ? laporan_polisi_id
                    : kendaraan.laporan_polisi_id,

            peran:
                peran !== undefined
                    ? peran
                    : kendaraan.peran,

            jenis_kendaraan_id:
                jenis_kendaraan_id !== undefined
                    ? jenis_kendaraan_id
                    : kendaraan.jenis_kendaraan_id,

            nopol:
                nopol !== undefined
                    ? nopol.trim()
                    : kendaraan.nopol,

            masa_laku_sw:
                masa_laku_sw !== undefined
                    ? masa_laku_sw
                    : kendaraan.masa_laku_sw,
        });

        return successResponse(
            res,
            200,
            "Kendaraan updated successfully",
            kendaraan
        );
    } catch (error) {
        logger.error(
            "Update kendaraan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to update kendaraan"
        );
    }
};

// DELETE /api/kendaraan/:id
const deleteKendaraan = async (req, res) => {
    try {
        const { id } = req.params;

        const kendaraan =
            await Kendaraan.findByPk(id);

        if (!kendaraan || !kendaraan.is_active) {
            return errorResponse(
                res,
                404,
                "Kendaraan not found"
            );
        }

        // Soft delete
        await kendaraan.update({
            is_active: false,
        });

        return successResponse(
            res,
            200,
            "Kendaraan deleted successfully",
            null
        );
    } catch (error) {
        logger.error(
            "Delete kendaraan error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to delete kendaraan"
        );
    }
};

module.exports = {
    getKendaraan,
    getKendaraanById,
    createKendaraan,
    updateKendaraan,
    deleteKendaraan,
};