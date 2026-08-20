const { Op } = require("sequelize");
const sequelize = require("../config/database");

const {
    LaporanPolisi,
    Korban,
    Polres,
    Wilayah,
    KasusTabrakKecelakaan,
    Profesi,
    JenisKendaraan,
    Kendaraan,
    Kecamatan,
    RumahSakit
} = require("../models");

const {
    successResponse,
    errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// Helper: geser tanggal mundur 1 bulan (menangani akhir bulan)
const shiftOneMonthBack = (dateStr) => {
    const date = new Date(dateStr); // format "YYYY-MM-DD"
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth(); // 0-based
    const day = date.getUTCDate();

    let targetYear = year;
    let targetMonth = month - 1;
    if (targetMonth < 0) {
        targetMonth = 11;
        targetYear--;
    }

    // Jumlah hari pada bulan target
    const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
    const targetDay = Math.min(day, daysInTargetMonth);

    const targetDate = new Date(Date.UTC(targetYear, targetMonth, targetDay));
    return targetDate.toISOString().split("T")[0];
};

/**
 * GET /api/laporan-polisi/statistik/perbandingan
 * Query params:
 *   - tanggal_awal (required)
 *   - tanggal_akhir (required)
 *   - polres_id (required, bisa "ALL")
 */
const getPerbandinganStatistik = async (req, res) => {
    try {
        const { tanggal_awal, tanggal_akhir, polres_id } = req.query;

        // 1. Validasi
        if (!tanggal_awal || !tanggal_akhir) {
            return errorResponse(res, 400, "Parameter tanggal_awal dan tanggal_akhir wajib diisi");
        }

        if (new Date(tanggal_awal) > new Date(tanggal_akhir)) {
            return errorResponse(res, 400, "tanggal_awal tidak boleh lebih besar dari tanggal_akhir");
        }

        // 2. Build where untuk LaporanPolisi
        const buildWhere = (start, end) => {
            const where = {
                is_active: true,
                tanggal_laka: { [Op.between]: [start, end] },
            };
            if (polres_id && polres_id !== "ALL") {
                where.polres_id = Number(polres_id);
            }
            return where;
        };

        // 3. Include Polres untuk scope wilayah (role user)
        const includePolres = [];
        if (req.user?.role === "user") {
            includePolres.push({
                model: Polres,
                as: "polres",
                attributes: [],
                where: { wilayah_id: req.user.wilayah_id },
                required: true,
            });
        }

        // 4. Tentukan periode utama & pembanding
        const mainStart = tanggal_awal;
        const mainEnd = tanggal_akhir;
        const cmpStart = shiftOneMonthBack(tanggal_awal);
        const cmpEnd = shiftOneMonthBack(tanggal_akhir);

        // 5. Hitung data periode utama
        const [mainLP, mainKorban] = await Promise.all([
            LaporanPolisi.count({
                where: buildWhere(mainStart, mainEnd),
                include: includePolres,
            }),
            Korban.count({
                where: { is_active: true },
                include: [
                    {
                        model: LaporanPolisi,
                        as: "laporanPolisi",
                        required: true,
                        attributes: [],
                        where: buildWhere(mainStart, mainEnd),
                        include: includePolres,
                    },
                ],
            }),
        ]);

        // 6. Hitung data periode pembanding
        const [cmpLP, cmpKorban] = await Promise.all([
            LaporanPolisi.count({
                where: buildWhere(cmpStart, cmpEnd),
                include: includePolres,
            }),
            Korban.count({
                where: { is_active: true },
                include: [
                    {
                        model: LaporanPolisi,
                        as: "laporanPolisi",
                        required: true,
                        attributes: [],
                        where: buildWhere(cmpStart, cmpEnd),
                        include: includePolres,
                    },
                ],
            }),
        ]);

        // 7. Hitung selisih
        const selisihLP = mainLP - cmpLP;
        const selisihKorban = mainKorban - cmpKorban;

        const data = {
            periode_utama: {
                tanggal_awal: mainStart,
                tanggal_akhir: mainEnd,
                total_lp: mainLP,
                total_korban: mainKorban,
            },
            periode_pembanding: {
                tanggal_awal: cmpStart,
                tanggal_akhir: cmpEnd,
                total_lp: cmpLP,
                total_korban: cmpKorban,
            },
            selisih: {
                selisih_lp: selisihLP,
                selisih_korban: selisihKorban,
            },
        };

        return successResponse(res, 200, "Perbandingan statistik retrieved successfully", data);
    } catch (error) {
        logger.error("Get perbandingan statistik error", error);
        return errorResponse(res, 500, "Failed to retrieve perbandingan statistik");
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/laporan-polisi/statistik/total-laka-per-wilayah
// Query params: from, to (opsional)
// Returns: total laporan polisi per wilayah (beserta nama & id)
// ─────────────────────────────────────────────────────────────
const getTotalLakaPerWilayah = async (req, res) => {
    try {
        const { from, to } = req.query;

        // Ambil semua wilayah aktif
        const whereWilayah = { is_active: true };
        if (req.user?.role === "user") {
            whereWilayah.id = req.user.wilayah_id;
        }
        const wilayahList = await Wilayah.findAll({
            where: whereWilayah,
            attributes: ["id", "nama"],
            order: [["id", "ASC"]],
            raw: true,
        });

        // Siapkan filter tanggal untuk LaporanPolisi
        const whereLaporan = { is_active: true };
        if (from) whereLaporan.tanggal_laka = { ...whereLaporan.tanggal_laka, [Op.gte]: from };
        if (to) whereLaporan.tanggal_laka = { ...whereLaporan.tanggal_laka, [Op.lte]: to };

        // Untuk setiap wilayah, hitung total laporan polisi
        const dataWilayah = await Promise.all(
            wilayahList.map(async (wilayah) => {
                const totalLaka = await LaporanPolisi.count({
                    where: whereLaporan,
                    include: [
                        {
                            model: Polres,
                            as: "polres",
                            where: { wilayah_id: wilayah.id },
                            required: true,
                            attributes: [],
                        },
                    ],
                });
                return {
                    id: wilayah.id,
                    nama: wilayah.nama,
                    total_laka: totalLaka,
                };
            })
        );

        const totalKeseluruhan = dataWilayah.reduce((sum, row) => sum + row.total_laka, 0);

        return successResponse(res, 200, "Total laka per wilayah retrieved successfully", {
            total_keseluruhan: totalKeseluruhan,
            data_wilayah: dataWilayah,
        });
    } catch (error) {
        logger.error("Get total laka per wilayah error", error);
        return errorResponse(res, 500, "Failed to retrieve total laka per wilayah");
    }
};

// endpoint get korban per loket
const getTotalKorbanPerWilayah = async (req, res) => {
    try {
        const { from, to } = req.query;

        // Ambil semua wilayah aktif
        const whereWilayah = { is_active: true };
        if (req.user?.role === "user") {
            whereWilayah.id = req.user.wilayah_id;
        }
        const wilayahList = await Wilayah.findAll({
            where: whereWilayah,
            attributes: ["id", "nama"],
            order: [["id", "ASC"]],
            raw: true,
        });

        // Siapkan filter tanggal untuk LaporanPolisi
        const whereLaporan = { is_active: true };
        if (from) whereLaporan.tanggal_laka = { ...whereLaporan.tanggal_laka, [Op.gte]: from };
        if (to) whereLaporan.tanggal_laka = { ...whereLaporan.tanggal_laka, [Op.lte]: to };

        // Untuk setiap wilayah, hitung total korban
        const dataWilayah = await Promise.all(
            wilayahList.map(async (wilayah) => {
                const totalKorban = await Korban.count({
                    where: { is_active: true },
                    include: [
                        {
                            model: LaporanPolisi,
                            as: "laporanPolisi",
                            required: true,
                            attributes: [],
                            where: whereLaporan,
                            include: [
                                {
                                    model: Polres,
                                    as: "polres",
                                    required: true,
                                    attributes: [],
                                    where: { wilayah_id: wilayah.id },
                                },
                            ],
                        },
                    ],
                });
                return {
                    id: wilayah.id,
                    nama: wilayah.nama,
                    total_korban: totalKorban,
                };
            })
        );

        const totalKeseluruhan = dataWilayah.reduce((sum, row) => sum + row.total_korban, 0);

        return successResponse(res, 200, "Total korban per wilayah retrieved successfully", {
            total_keseluruhan: totalKeseluruhan,
            data_wilayah: dataWilayah,
        });
    } catch (error) {
        logger.error("Get total korban per wilayah error", error);
        return errorResponse(res, 500, "Failed to retrieve total korban per wilayah");
    }
};

// get jenis laka
// ─────────────────────────────────────────────────────────────
// GET /api/laporan-polisi/statistik/kasus-tabrak
// Query params: from, to, polres_id, kecamatan_id
// Returns: total laporan & distribusi per tipe kasus tabrak + persentase
// ─────────────────────────────────────────────────────────────
const getStatistikKasusTabrak = async (req, res) => {
    try {
        const { from, to, polres_id, kecamatan_id } = req.query;

        // Base filter untuk LaporanPolisi
        const baseWhere = { is_active: true };

        if (from) baseWhere.tanggal_laka = { ...baseWhere.tanggal_laka, [Op.gte]: from };
        if (to) baseWhere.tanggal_laka = { ...baseWhere.tanggal_laka, [Op.lte]: to };
        if (polres_id) baseWhere.polres_id = Number(polres_id);
        if (kecamatan_id) baseWhere.kecamatan_id = Number(kecamatan_id);

        // Scope wilayah otomatis untuk user
        const includePolres = [];
        if (req.user?.role === "user") {
            includePolres.push({
                model: Polres,
                as: "polres",
                attributes: [],
                where: { wilayah_id: req.user.wilayah_id },
                required: true,
            });
        }

        // Fungsi helper untuk menghitung laporan dengan kasus_tabrak_kecelakaan_id tertentu (atau null)
        const countLaporanByKasus = async (kasusId) => {
            const where = { ...baseWhere };
            if (kasusId === null || kasusId === undefined) {
                where.kasus_tabrak_kecelakaan_id = { [Op.is]: null };
            } else {
                where.kasus_tabrak_kecelakaan_id = kasusId;
            }
            return LaporanPolisi.count({
                where,
                include: includePolres,
            });
        };

        // 1. Total seluruh laporan yang memenuhi filter (denominator)
        const totalLaporan = await LaporanPolisi.count({
            where: baseWhere,
            include: includePolres,
        });

        // 2. Ambil semua tipe kasus tabrak aktif
        const kasusList = await KasusTabrakKecelakaan.findAll({
            where: { is_active: true },
            attributes: ["id", "nama"],
            order: [["id", "ASC"]],
            raw: true,
        });

        // 3. Hitung jumlah laporan untuk masing-masing tipe kasus
        const counts = await Promise.all(
            kasusList.map((k) => countLaporanByKasus(k.id))
        );

        // 4. Hitung laporan tanpa tipe kasus (null)
        const totalTanpaKasus = await countLaporanByKasus(null);

        // 5. Susun data respons
        const rincianKasus = kasusList.map((k, index) => {
            const total = counts[index];
            return {
                id: k.id,
                nama: k.nama,
                total,
                persentase: totalLaporan > 0 ? `${((total / totalLaporan) * 100).toFixed(2)}%` : "0.00%",
            };
        });

        const data = {
            total_laporan: totalLaporan,
            rincian_kasus: rincianKasus,
            tanpa_kasus: {
                total: totalTanpaKasus,
                persentase: totalLaporan > 0 ? `${((totalTanpaKasus / totalLaporan) * 100).toFixed(2)}%` : "0.00%",
            },
        };

        return successResponse(res, 200, "Statistik kasus tabrak retrieved successfully", data);
    } catch (error) {
        logger.error("Get statistik kasus tabrak error", error);
        return errorResponse(res, 500, "Failed to retrieve statistik kasus tabrak");
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/laporan-polisi/statistik/korban-per-profesi
// Query params: from, to, polres_id, kecamatan_id
// Returns: total korban & distribusi per profesi + persentase
// ─────────────────────────────────────────────────────────────
const getStatistikKorbanByProfesi = async (req, res) => {
    try {
        const { from, to, polres_id, kecamatan_id } = req.query;

        // Base filter untuk LaporanPolisi (dipakai di nested include)
        const whereLaporan = { is_active: true };

        if (from) whereLaporan.tanggal_laka = { ...whereLaporan.tanggal_laka, [Op.gte]: from };
        if (to) whereLaporan.tanggal_laka = { ...whereLaporan.tanggal_laka, [Op.lte]: to };
        if (polres_id) whereLaporan.polres_id = Number(polres_id);
        if (kecamatan_id) whereLaporan.kecamatan_id = Number(kecamatan_id);

        // Scope wilayah otomatis untuk user (nested include Polres)
        const includePolres = [];
        if (req.user?.role === "user") {
            includePolres.push({
                model: Polres,
                as: "polres",
                attributes: [],
                where: { wilayah_id: req.user.wilayah_id },
                required: true,
            });
        }

        // Helper: hitung korban dengan filter laporan + filter profesi_id
        const countKorban = async (profesiId = null) => {
            const whereKorban = { is_active: true };
            if (profesiId === null) {
                // profesi_id IS NULL
                whereKorban.profesi_id = { [Op.is]: null };
            } else {
                whereKorban.profesi_id = profesiId;
            }

            return Korban.count({
                where: whereKorban,
                include: [
                    {
                        model: LaporanPolisi,
                        as: "laporanPolisi",
                        required: true,
                        attributes: [],
                        where: whereLaporan,
                        include: includePolres,
                    },
                ],
            });
        };

        // 1. Total korban keseluruhan (denominator)
        const totalKorban = await Korban.count({
            where: { is_active: true },
            include: [
                {
                    model: LaporanPolisi,
                    as: "laporanPolisi",
                    required: true,
                    attributes: [],
                    where: whereLaporan,
                    include: includePolres,
                },
            ],
        });

        // 2. Ambil semua profesi aktif
        const profesiList = await Profesi.findAll({
            where: { is_active: true },
            attributes: ["id", "nama"],
            order: [["id", "ASC"]],
            raw: true,
        });

        // 3. Hitung jumlah korban untuk masing-masing profesi
        const counts = await Promise.all(
            profesiList.map((p) => countKorban(p.id))
        );

        // 4. Hitung korban tanpa profesi
        const totalTanpaProfesi = await countKorban(null);

        // 5. Susun data respons
        const rincianProfesi = profesiList.map((p, index) => {
            const total = counts[index];
            return {
                id: p.id,
                nama: p.nama,
                total,
                persentase: totalKorban > 0 ? `${((total / totalKorban) * 100).toFixed(2)}%` : "0.00%",
            };
        });

        const data = {
            total_korban: totalKorban,
            rincian_profesi: rincianProfesi,
            tanpa_profesi: {
                total: totalTanpaProfesi,
                persentase: totalKorban > 0 ? `${((totalTanpaProfesi / totalKorban) * 100).toFixed(2)}%` : "0.00%",
            },
        };

        return successResponse(res, 200, "Statistik korban berdasarkan profesi retrieved successfully", data);
    } catch (error) {
        logger.error("Get statistik korban berdasarkan profesi error", error);
        return errorResponse(res, 500, "Failed to retrieve statistik korban berdasarkan profesi");
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/laporan-polisi/statistik/korban-per-jenis-kendaraan
// Query params: from, to, polres_id, kecamatan_id
// Returns: total korban & distribusi per jenis kendaraan + persentase
// ─────────────────────────────────────────────────────────────
const getStatistikKorbanByJenisKendaraan = async (req, res) => {
    try {
        const { from, to, polres_id, kecamatan_id } = req.query;

        // Base filter untuk LaporanPolisi (dipakai di nested include)
        const whereLaporan = { is_active: true };

        if (from) whereLaporan.tanggal_laka = { ...whereLaporan.tanggal_laka, [Op.gte]: from };
        if (to) whereLaporan.tanggal_laka = { ...whereLaporan.tanggal_laka, [Op.lte]: to };
        if (polres_id) whereLaporan.polres_id = Number(polres_id);
        if (kecamatan_id) whereLaporan.kecamatan_id = Number(kecamatan_id);

        // Scope wilayah otomatis untuk user (nested include Polres)
        const includePolres = [];
        if (req.user?.role === "user") {
            includePolres.push({
                model: Polres,
                as: "polres",
                attributes: [],
                where: { wilayah_id: req.user.wilayah_id },
                required: true,
            });
        }

        // Helper: hitung korban dengan filter laporan + filter jenis kendaraan
        const countKorban = async (jenisKendaraanId = null, withKendaraan = true) => {
            const whereKorban = { is_active: true };

            // Include Kendaraan jika diperlukan
            const includeKendaraan = [];
            if (withKendaraan) {
                // Korban yang memiliki kendaraan dan jenis kendaraan tertentu
                includeKendaraan.push({
                    model: Kendaraan,
                    as: "kendaraan",
                    required: true,
                    attributes: [],
                    where: jenisKendaraanId
                        ? { jenis_kendaraan_id: jenisKendaraanId }
                        : { jenis_kendaraan_id: { [Op.is]: null } },
                });
            } else {
                // Korban tanpa kendaraan sama sekali
                whereKorban.kendaraan_id = { [Op.is]: null };
            }

            return Korban.count({
                where: whereKorban,
                include: [
                    ...includeKendaraan,
                    {
                        model: LaporanPolisi,
                        as: "laporanPolisi",
                        required: true,
                        attributes: [],
                        where: whereLaporan,
                        include: includePolres,
                    },
                ],
            });
        };

        // 1. Total korban keseluruhan (denominator)
        const totalKorban = await Korban.count({
            where: { is_active: true },
            include: [
                {
                    model: LaporanPolisi,
                    as: "laporanPolisi",
                    required: true,
                    attributes: [],
                    where: whereLaporan,
                    include: includePolres,
                },
            ],
        });

        // 2. Ambil semua jenis kendaraan aktif
        const jenisKendaraanList = await JenisKendaraan.findAll({
            where: { is_active: true },
            attributes: ["id", "nama"],
            order: [["id", "ASC"]],
            raw: true,
        });

        // 3. Hitung jumlah korban untuk masing-masing jenis kendaraan
        const counts = await Promise.all(
            jenisKendaraanList.map((j) => countKorban(j.id, true))
        );

        // 4. Hitung korban tanpa kendaraan
        const totalTanpaKendaraan = await countKorban(null, false);

        // 5. Susun data respons
        const rincianJenisKendaraan = jenisKendaraanList.map((j, index) => {
            const total = counts[index];
            return {
                id: j.id,
                nama: j.nama,
                total,
                persentase: totalKorban > 0 ? `${((total / totalKorban) * 100).toFixed(2)}%` : "0.00%",
            };
        });

        const data = {
            total_korban: totalKorban,
            rincian_jenis_kendaraan: rincianJenisKendaraan,
            tanpa_kendaraan: {
                total: totalTanpaKendaraan,
                persentase: totalKorban > 0 ? `${((totalTanpaKendaraan / totalKorban) * 100).toFixed(2)}%` : "0.00%",
            },
        };

        return successResponse(res, 200, "Statistik korban berdasarkan jenis kendaraan retrieved successfully", data);
    } catch (error) {
        logger.error("Get statistik korban berdasarkan jenis kendaraan error", error);
        return errorResponse(res, 500, "Failed to retrieve statistik korban berdasarkan jenis kendaraan");
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/laporan-polisi/statistik/top-20-kecamatan-laka
// Query params: from, to, polres_id
// Returns: 20 kecamatan dengan total laka tertinggi
// ─────────────────────────────────────────────────────────────
const getTop20KecamatanLaka = async (req, res) => {
    try {
        const { from, to, polres_id } = req.query;

        // Base filter untuk LaporanPolisi
        const whereLaporan = { is_active: true };

        if (from) whereLaporan.tanggal_laka = { ...whereLaporan.tanggal_laka, [Op.gte]: from };
        if (to) whereLaporan.tanggal_laka = { ...whereLaporan.tanggal_laka, [Op.lte]: to };
        if (polres_id && polres_id !== "ALL") {
            whereLaporan.polres_id = Number(polres_id);
        }

        // Include Kecamatan dengan optional filter wilayah untuk user
        const includeKecamatan = {
            model: Kecamatan,
            as: "kecamatan",
            attributes: ["id", "nama"],
            required: true,
            include: [],
        };

        if (req.user?.role === "user") {
            includeKecamatan.include.push({
                model: Polres,
                as: "polres",
                attributes: [],
                where: { wilayah_id: req.user.wilayah_id },
                required: true,
            });
        }

        // Query agregasi: hitung jumlah laporan per kecamatan
        const result = await LaporanPolisi.findAll({
            attributes: [
                "kecamatan_id",
                [sequelize.fn("COUNT", sequelize.col("LaporanPolisi.id")), "total_laka"],
            ],
            where: whereLaporan,
            include: [includeKecamatan],
            group: ["LaporanPolisi.kecamatan_id", "kecamatan.id", "kecamatan.nama"],
            order: [[sequelize.literal("total_laka"), "DESC"]],
            limit: 20,
            raw: true,
        });

        // Format hasil agar mudah dibaca
        const data = result.map((row) => ({
            kecamatan_id: row.kecamatan_id,
            nama_kecamatan: row["kecamatan.nama"] || row.nama,
            total_laka: parseInt(row.total_laka, 10) || 0,
        }));

        return successResponse(res, 200, "Top 20 kecamatan laka retrieved successfully", data);
    } catch (error) {
        logger.error("Get top 20 kecamatan laka error", error);
        return errorResponse(res, 500, "Failed to retrieve top 20 kecamatan laka");
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/laporan-polisi/statistik/top-15-rumah-sakit-korban
// Query params: from, to, polres_id, kecamatan_id
// Returns: 15 rumah sakit dengan total korban terbanyak
// ─────────────────────────────────────────────────────────────
const getTop15RumahSakitKorban = async (req, res) => {
    try {
        const { from, to, polres_id, kecamatan_id } = req.query;

        // Base filter untuk LaporanPolisi (hanya yang memiliki rumah_sakit_id)
        const whereLaporan = {
            is_active: true,
            rumah_sakit_id: { [Op.ne]: null },
        };

        if (from) whereLaporan.tanggal_laka = { ...whereLaporan.tanggal_laka, [Op.gte]: from };
        if (to) whereLaporan.tanggal_laka = { ...whereLaporan.tanggal_laka, [Op.lte]: to };
        if (polres_id) whereLaporan.polres_id = Number(polres_id);
        if (kecamatan_id) whereLaporan.kecamatan_id = Number(kecamatan_id);

        // Include LaporanPolisi dengan optional filter wilayah untuk user
        const includeLaporan = {
            model: LaporanPolisi,
            as: "laporanPolisi",
            required: true,
            attributes: [],
            where: whereLaporan,
            include: [],
        };

        if (req.user?.role === "user") {
            includeLaporan.include.push({
                model: Polres,
                as: "polres",
                attributes: [],
                where: { wilayah_id: req.user.wilayah_id },
                required: true,
            });
        }

        // 1. Agregasi total korban per rumah_sakit_id
        const result = await Korban.findAll({
            attributes: [
                [sequelize.col("laporanPolisi.rumah_sakit_id"), "rumah_sakit_id"],
                [sequelize.fn("COUNT", sequelize.col("Korban.id")), "total_korban"],
            ],
            where: { is_active: true },
            include: [includeLaporan],
            group: ["laporanPolisi.rumah_sakit_id"],
            order: [[sequelize.literal("total_korban"), "DESC"]],
            limit: 15,
            raw: true,
        });

        // 2. Ambil data nama rumah sakit berdasarkan ID
        const ids = result.map((r) => r.rumah_sakit_id).filter((id) => id !== null && id !== undefined);
        const rumahSakitList = await RumahSakit.findAll({
            where: { id: { [Op.in]: ids }, is_active: true },
            attributes: ["id", "nama"],
            raw: true,
        });

        const rsMap = {};
        rumahSakitList.forEach((rs) => {
            rsMap[rs.id] = rs.nama;
        });

        // 3. Susun data respons
        const data = result.map((r) => ({
            rumah_sakit_id: r.rumah_sakit_id,
            nama_rumah_sakit: rsMap[r.rumah_sakit_id] || "Tidak Diketahui",
            total_korban: parseInt(r.total_korban, 10) || 0,
        }));

        return successResponse(res, 200, "Top 15 rumah sakit korban retrieved successfully", data);
    } catch (error) {
        logger.error("Get top 15 rumah sakit korban error", error);
        return errorResponse(res, 500, "Failed to retrieve top 15 rumah sakit korban");
    }
};

module.exports = {
    getPerbandinganStatistik,
    getTotalLakaPerWilayah,
    getTotalKorbanPerWilayah,
    getStatistikKasusTabrak,
    getStatistikKorbanByProfesi,
    getStatistikKorbanByJenisKendaraan,
    getTop20KecamatanLaka,
    getTop15RumahSakitKorban
};