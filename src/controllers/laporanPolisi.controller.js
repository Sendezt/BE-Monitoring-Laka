const { LaporanPolisi } = require("../models");

const {
    successResponse,
    errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// GET /api/laporan-polisi
const getLaporanPolisi = async (req, res) => {
    try {
        const laporanPolisi = await LaporanPolisi.findAll({
            where: {
                is_active: true,
            },
            order: [["tanggal_laka", "DESC"]],
        });

        return successResponse(
            res,
            200,
            "Laporan polisi retrieved successfully",
            laporanPolisi
        );
    } catch (error) {
        logger.error(
            "Get laporan polisi error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to retrieve laporan polisi"
        );
    }
};

// GET /api/laporan-polisi/:id
const getLaporanPolisiById = async (req, res) => {
    try {
        const { id } = req.params;

        const laporanPolisi =
            await LaporanPolisi.findByPk(id);

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

        return successResponse(
            res,
            200,
            "Laporan polisi retrieved successfully",
            laporanPolisi
        );
    } catch (error) {
        logger.error(
            "Get laporan polisi by ID error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to retrieve laporan polisi"
        );
    }
};

// POST /api/laporan-polisi
const createLaporanPolisi = async (req, res) => {
    try {
        const {
            no_lp,
            tanggal_laka,
            hari_kejadian,
            tanggal_lp,
            telat_lp,
            kecamatan_id,
            kelurahan_id,
            lokasi_laka,
            rumah_sakit_id,
            rumah_sakit_wilayah,
            laka_tunggal,
            tindak_lanjut_id,
            jenis_jaminan_id,
            keterjaminan_id,
            kasus_tabrak_kecelakaan_id,
            faktor_penyebab_laka_id,
            sifat_laka_id,
            keterangan,
        } = req.body;

        // Required fields
        if (
            !no_lp ||
            !tanggal_laka ||
            !hari_kejadian ||
            !tanggal_lp ||
            kecamatan_id === undefined ||
            kecamatan_id === null ||
            kelurahan_id === undefined ||
            kelurahan_id === null ||
            !lokasi_laka
        ) {
            return errorResponse(
                res,
                400,
                "no_lp, tanggal_laka, hari_kejadian, tanggal_lp, kecamatan_id, kelurahan_id, and lokasi_laka are required"
            );
        }

        // Check duplicate nomor LP
        const existingLaporan =
            await LaporanPolisi.findOne({
                where: {
                    no_lp,
                },
            });

        if (existingLaporan) {
            return errorResponse(
                res,
                409,
                "Nomor LP already exists"
            );
        }

        const laporanPolisi =
            await LaporanPolisi.create({
                no_lp,
                tanggal_laka,
                hari_kejadian,
                tanggal_lp,
                telat_lp: telat_lp ?? 0,
                kecamatan_id,
                kelurahan_id,
                lokasi_laka,
                rumah_sakit_id:
                    rumah_sakit_id ?? null,
                rumah_sakit_wilayah:
                    rumah_sakit_wilayah ?? null,
                laka_tunggal:
                    laka_tunggal ?? false,
                tindak_lanjut_id:
                    tindak_lanjut_id ?? null,
                jenis_jaminan_id:
                    jenis_jaminan_id ?? null,
                keterjaminan_id:
                    keterjaminan_id ?? null,
                kasus_tabrak_kecelakaan_id:
                    kasus_tabrak_kecelakaan_id ?? null,
                faktor_penyebab_laka_id:
                    faktor_penyebab_laka_id ?? null,
                sifat_laka_id:
                    sifat_laka_id ?? null,
                keterangan:
                    keterangan ?? null,
                is_active: true,
            });

        return successResponse(
            res,
            201,
            "Laporan polisi created successfully",
            laporanPolisi
        );
    } catch (error) {
        logger.error(
            "Create laporan polisi error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to create laporan polisi"
        );
    }
};

// PUT /api/laporan-polisi/:id
const updateLaporanPolisi = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            no_lp,
            tanggal_laka,
            hari_kejadian,
            tanggal_lp,
            telat_lp,
            kecamatan_id,
            kelurahan_id,
            lokasi_laka,
            rumah_sakit_id,
            rumah_sakit_wilayah,
            laka_tunggal,
            tindak_lanjut_id,
            jenis_jaminan_id,
            keterjaminan_id,
            kasus_tabrak_kecelakaan_id,
            faktor_penyebab_laka_id,
            sifat_laka_id,
            keterangan,
        } = req.body;

        const laporanPolisi =
            await LaporanPolisi.findByPk(id);

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

        // Check duplicate nomor LP
        if (no_lp) {
            const existingLaporan =
                await LaporanPolisi.findOne({
                    where: {
                        no_lp,
                    },
                });

            if (
                existingLaporan &&
                existingLaporan.id !== laporanPolisi.id
            ) {
                return errorResponse(
                    res,
                    409,
                    "Nomor LP already exists"
                );
            }
        }

        await laporanPolisi.update({
            no_lp:
                no_lp ?? laporanPolisi.no_lp,

            tanggal_laka:
                tanggal_laka ??
                laporanPolisi.tanggal_laka,

            hari_kejadian:
                hari_kejadian ??
                laporanPolisi.hari_kejadian,

            tanggal_lp:
                tanggal_lp ??
                laporanPolisi.tanggal_lp,

            telat_lp:
                telat_lp ?? laporanPolisi.telat_lp,

            kecamatan_id:
                kecamatan_id ??
                laporanPolisi.kecamatan_id,

            kelurahan_id:
                kelurahan_id ??
                laporanPolisi.kelurahan_id,

            lokasi_laka:
                lokasi_laka ??
                laporanPolisi.lokasi_laka,

            rumah_sakit_id:
                rumah_sakit_id ?? null,

            rumah_sakit_wilayah:
                rumah_sakit_wilayah ?? null,

            laka_tunggal:
                laka_tunggal ??
                laporanPolisi.laka_tunggal,

            tindak_lanjut_id:
                tindak_lanjut_id ?? null,

            jenis_jaminan_id:
                jenis_jaminan_id ?? null,

            keterjaminan_id:
                keterjaminan_id ?? null,

            kasus_tabrak_kecelakaan_id:
                kasus_tabrak_kecelakaan_id ?? null,

            faktor_penyebab_laka_id:
                faktor_penyebab_laka_id ?? null,

            sifat_laka_id:
                sifat_laka_id ?? null,

            keterangan:
                keterangan ?? null,
        });

        return successResponse(
            res,
            200,
            "Laporan polisi updated successfully",
            laporanPolisi
        );
    } catch (error) {
        logger.error(
            "Update laporan polisi error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to update laporan polisi"
        );
    }
};

// DELETE /api/laporan-polisi/:id
const deleteLaporanPolisi = async (req, res) => {
    try {
        const { id } = req.params;

        const laporanPolisi =
            await LaporanPolisi.findByPk(id);

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

        // Soft delete
        await laporanPolisi.update({
            is_active: false,
        });

        return successResponse(
            res,
            200,
            "Laporan polisi deleted successfully",
            null
        );
    } catch (error) {
        logger.error(
            "Delete laporan polisi error",
            error
        );

        return errorResponse(
            res,
            500,
            "Failed to delete laporan polisi"
        );
    }
};

module.exports = {
    getLaporanPolisi,
    getLaporanPolisiById,
    createLaporanPolisi,
    updateLaporanPolisi,
    deleteLaporanPolisi,
};