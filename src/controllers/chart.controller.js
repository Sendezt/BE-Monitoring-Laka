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
    RumahSakit,
    Cidera,
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
                tanggal_lp: { [Op.between]: [start, end] },
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
// GET /api/chart/perbandingan-cidera
// Query: tanggal_awal, tanggal_akhir, polres_id (opsional/ALL)
// Bandingkan jumlah korban per kategori cidera (LL, LL-MD, MD)
// antara periode utama dan periode pembanding (mundur 1 bulan).
// ─────────────────────────────────────────────────────────────
const getPerbandinganCidera = async (req, res) => {
    try {
        const { tanggal_awal, tanggal_akhir, polres_id } = req.query;

        if (!tanggal_awal || !tanggal_akhir) {
            return errorResponse(res, 400, "Parameter tanggal_awal dan tanggal_akhir wajib diisi");
        }
        if (new Date(tanggal_awal) > new Date(tanggal_akhir)) {
            return errorResponse(res, 400, "tanggal_awal tidak boleh lebih besar dari tanggal_akhir");
        }

        const mainStart = tanggal_awal;
        const mainEnd = tanggal_akhir;
        const cmpStart = shiftOneMonthBack(tanggal_awal);
        const cmpEnd = shiftOneMonthBack(tanggal_akhir);

        // Scope wilayah untuk role user
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

        const buildLaporanWhere = (start, end) => {
            const where = { is_active: true, tanggal_lp: { [Op.between]: [start, end] } };
            if (polres_id && polres_id !== "ALL") where.polres_id = Number(polres_id);
            return where;
        };

        // Ambil id cidera per kategori (nama persis: LL, LL-MD, MD)
        const namaCidera = ["LL", "LL-MD", "MD"];
        const cideraRecords = await Cidera.findAll({
            where: { nama: { [Op.in]: namaCidera } },
            attributes: ["id", "nama"],
            raw: true,
        });
        const idByNama = {};
        for (const nama of namaCidera) {
            idByNama[nama] = cideraRecords.filter((c) => c.nama === nama).map((c) => c.id);
        }

        // Hitung korban per kategori cidera pada satu periode
        const countCidera = async (start, end, cideraIds) => {
            if (!cideraIds || cideraIds.length === 0) return 0;
            return Korban.count({
                where: { is_active: true, cidera_id: { [Op.in]: cideraIds } },
                include: [
                    {
                        model: LaporanPolisi,
                        as: "laporanPolisi",
                        required: true,
                        attributes: [],
                        where: buildLaporanWhere(start, end),
                        include: includePolres,
                    },
                ],
            });
        };

        const [
            mainLL, mainLLMD, mainMD,
            cmpLL, cmpLLMD, cmpMD,
        ] = await Promise.all([
            countCidera(mainStart, mainEnd, idByNama["LL"]),
            countCidera(mainStart, mainEnd, idByNama["LL-MD"]),
            countCidera(mainStart, mainEnd, idByNama["MD"]),
            countCidera(cmpStart, cmpEnd, idByNama["LL"]),
            countCidera(cmpStart, cmpEnd, idByNama["LL-MD"]),
            countCidera(cmpStart, cmpEnd, idByNama["MD"]),
        ]);

        const data = {
            periode_utama: {
                tanggal_awal: mainStart,
                tanggal_akhir: mainEnd,
                ll: mainLL,
                ll_md: mainLLMD,
                md: mainMD,
            },
            periode_pembanding: {
                tanggal_awal: cmpStart,
                tanggal_akhir: cmpEnd,
                ll: cmpLL,
                ll_md: cmpLLMD,
                md: cmpMD,
            },
            selisih: {
                ll: mainLL - cmpLL,
                ll_md: mainLLMD - cmpLLMD,
                md: mainMD - cmpMD,
            },
        };

        return successResponse(res, 200, "Perbandingan cidera retrieved successfully", data);
    } catch (error) {
        logger.error("Get perbandingan cidera error", error);
        return errorResponse(res, 500, "Failed to retrieve perbandingan cidera");
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
        if (from) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.gte]: from };
        if (to) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.lte]: to };

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
        if (from) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.gte]: from };
        if (to) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.lte]: to };

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

        if (from) baseWhere.tanggal_lp = { ...baseWhere.tanggal_lp, [Op.gte]: from };
        if (to) baseWhere.tanggal_lp = { ...baseWhere.tanggal_lp, [Op.lte]: to };
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

        if (from) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.gte]: from };
        if (to) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.lte]: to };
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

        if (from) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.gte]: from };
        if (to) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.lte]: to };
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

        if (from) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.gte]: from };
        if (to) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.lte]: to };
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
// GET /api/chart/statistik/top-10-polres-laka
// Query params: from, to, polres_id
// Returns: 10 polres dengan total laporan polisi terbanyak (agregasi di DB)
// ─────────────────────────────────────────────────────────────
const getTop10PolresLaka = async (req, res) => {
    try {
        const { from, to, polres_id } = req.query;

        const whereLaporan = { is_active: true };
        if (from) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.gte]: from };
        if (to) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.lte]: to };
        if (polres_id && polres_id !== "ALL") {
            whereLaporan.polres_id = Number(polres_id);
        }

        // Include Polres, dengan optional scope wilayah untuk role user
        const includePolres = {
            model: Polres,
            as: "polres",
            attributes: ["id", "nama"],
            required: true,
        };
        if (req.user?.role === "user") {
            includePolres.where = { wilayah_id: req.user.wilayah_id };
        }

        const result = await LaporanPolisi.findAll({
            attributes: [
                "polres_id",
                [sequelize.fn("COUNT", sequelize.col("LaporanPolisi.id")), "total_laka"],
            ],
            where: whereLaporan,
            include: [includePolres],
            group: ["LaporanPolisi.polres_id", "polres.id", "polres.nama"],
            order: [[sequelize.literal("total_laka"), "DESC"]],
            limit: 10,
            raw: true,
        });

        const data = result.map((row) => ({
            polres_id: row.polres_id,
            nama_polres: row["polres.nama"] || row.nama,
            total_laka: parseInt(row.total_laka, 10) || 0,
        }));

        return successResponse(res, 200, "Top 10 polres laka retrieved successfully", data);
    } catch (error) {
        logger.error("Get top 10 polres laka error", error);
        return errorResponse(res, 500, "Failed to retrieve top 10 polres laka");
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

        // Base filter untuk LaporanPolisi
        const whereLaporan = {
            is_active: true,
        };

        if (from) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.gte]: from };
        if (to) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.lte]: to };
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
                "rumah_sakit_id",
                [sequelize.fn("COUNT", sequelize.col("Korban.id")), "total_korban"],
            ],
            where: { 
                is_active: true,
                rumah_sakit_id: { [Op.ne]: null },
            },
            include: [includeLaporan],
            group: ["Korban.rumah_sakit_id"],
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


// ─────────────────────────────────────────────────────────────
// Helper: generate array tanggal dari start s/d end (YYYY-MM-DD)
// ─────────────────────────────────────────────────────────────
const generateDateRange = (start, end) => {
    const dates = [];
    const current = new Date(start);
    const last = new Date(end);

    while (current <= last) {
        dates.push(current.toISOString().split("T")[0]);
        current.setUTCDate(current.getUTCDate() + 1);
    }
    return dates;
};


// ─────────────────────────────────────────────────────────────
// Helper: ambil peta total LP per tanggal (YYYY-MM-DD → total)
// ─────────────────────────────────────────────────────────────
const fetchLaporanPerDay = async (start, end, polresId, userWilayahId) => {
    const where = {
        is_active: true,
        tanggal_lp: { [Op.between]: [start, end] },
    };

    if (polresId && polresId !== "ALL") {
        where.polres_id = Number(polresId);
    }

    const include = [];
    if (userWilayahId) {
        include.push({
            model: Polres,
            as: "polres",
            attributes: [],
            where: { wilayah_id: userWilayahId },
            required: true,
        });
    }

    const rows = await LaporanPolisi.findAll({
        attributes: [
            "tanggal_lp",
            [sequelize.fn("COUNT", sequelize.col("LaporanPolisi.id")), "total_lp"],
        ],
        where,
        include,
        group: ["tanggal_lp"],
        raw: true,
    });

    const map = {};
    rows.forEach((row) => {
        map[row.tanggal_lp] = parseInt(row.total_lp, 10) || 0;
    });
    return map;
};

// ─────────────────────────────────────────────────────────────
// Helper: ambil peta total korban per tanggal
// ─────────────────────────────────────────────────────────────
const fetchKorbanPerDay = async (start, end, polresId, userWilayahId) => {
    const whereLaporan = {
        is_active: true,
        tanggal_lp: { [Op.between]: [start, end] },
    };

    if (polresId && polresId !== "ALL") {
        whereLaporan.polres_id = Number(polresId);
    }

    const includeLaporan = {
        model: LaporanPolisi,
        as: "laporanPolisi",
        required: true,
        attributes: [],
        where: whereLaporan,
    };

    if (userWilayahId) {
        includeLaporan.include = [
            {
                model: Polres,
                as: "polres",
                attributes: [],
                where: { wilayah_id: userWilayahId },
                required: true,
            },
        ];
    }

    const rows = await Korban.findAll({
        attributes: [
            [sequelize.col("laporanPolisi.tanggal_lp"), "tanggal_lp"],
            [sequelize.fn("COUNT", sequelize.col("Korban.id")), "total_korban"],
        ],
        where: { is_active: true },
        include: [includeLaporan],
        group: ["laporanPolisi.tanggal_lp"],
        raw: true,
    });

    const map = {};
    rows.forEach((row) => {
        map[row.tanggal_lp] = parseInt(row.total_korban, 10) || 0;
    });
    return map;
};

// ─────────────────────────────────────────────────────────────
// GET /api/laporan-polisi/statistik/trend-harian
// ─────────────────────────────────────────────────────────────
const getTrendHarianLPKorban = async (req, res) => {
    try {
        const { tanggal_awal, tanggal_akhir, polres_id } = req.query;

        // 1. Validasi
        if (!tanggal_awal || !tanggal_akhir) {
            return errorResponse(
                res,
                400,
                "Parameter tanggal_awal dan tanggal_akhir wajib diisi"
            );
        }

        if (new Date(tanggal_awal) > new Date(tanggal_akhir)) {
            return errorResponse(
                res,
                400,
                "tanggal_awal tidak boleh lebih besar dari tanggal_akhir"
            );
        }

        // 2. Tentukan periode
        const mainStart = tanggal_awal;
        const mainEnd = tanggal_akhir;
        const cmpStart = shiftOneMonthBack(mainStart);
        const cmpEnd = shiftOneMonthBack(mainEnd);

        // 3. Scope wilayah untuk role user
        const userWilayahId =
            req.user?.role === "user" ? req.user.wilayah_id : null;

        // 4. Daftar tanggal utama (periode utama)
        const mainDates = generateDateRange(mainStart, mainEnd);

        // 5. Daftar tanggal pembanding (pasangan per hari)
        const cmpDates = mainDates.map((d) => shiftOneMonthBack(d));

        // 6. Ambil peta data untuk periode utama
        const [lpMainMap, korbanMainMap] = await Promise.all([
            fetchLaporanPerDay(mainStart, mainEnd, polres_id, userWilayahId),
            fetchKorbanPerDay(mainStart, mainEnd, polres_id, userWilayahId),
        ]);

        // 7. Ambil peta data untuk periode pembanding
        const [lpCmpMap, korbanCmpMap] = await Promise.all([
            fetchLaporanPerDay(cmpStart, cmpEnd, polres_id, userWilayahId),
            fetchKorbanPerDay(cmpStart, cmpEnd, polres_id, userWilayahId),
        ]);

        // 8. Bentuk data trend per hari
        const trend = mainDates.map((date, index) => {
            const cmpDate = cmpDates[index];
            return {
                tanggal: date.slice(8, 10), // ambil "DD"
                lp_periode_utama: lpMainMap[date] || 0,
                korban_periode_utama: korbanMainMap[date] || 0,
                lp_periode_pembanding: lpCmpMap[cmpDate] || 0,
                korban_periode_pembanding: korbanCmpMap[cmpDate] || 0,
            };
        });

        // 9. Susun response
        const data = {
            periode_utama: {
                tanggal_awal: mainStart,
                tanggal_akhir: mainEnd,
            },
            periode_pembanding: {
                tanggal_awal: cmpStart,
                tanggal_akhir: cmpEnd,
            },
            trend,
        };

        return successResponse(
            res,
            200,
            "Data trend LP dan korban berhasil diambil",
            data
        );
    } catch (error) {
        logger.error("Get trend harian LP korban error", error);
        return errorResponse(res, 500, "Failed to retrieve trend harian LP korban");
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/chart/statistik/tren-bulanan
// Query params: from, to, polres_id
// Returns: jumlah LP per bulan (agregasi DB) untuk N bulan.
// Dipakai bar chart "Tren Laporan per Bulan" di dashboard.
// ─────────────────────────────────────────────────────────────
const getTrenBulanan = async (req, res) => {
    try {
        const { from, to, polres_id } = req.query;

        const where = { is_active: true };
        if (from) where.tanggal_lp = { ...where.tanggal_lp, [Op.gte]: from };
        if (to) where.tanggal_lp = { ...where.tanggal_lp, [Op.lte]: to };
        if (polres_id && polres_id !== "ALL") {
            where.polres_id = Number(polres_id);
        }

        const include = [];
        if (req.user?.role === "user") {
            include.push({
                model: Polres,
                as: "polres",
                attributes: [],
                where: { wilayah_id: req.user.wilayah_id },
                required: true,
            });
        }

        // Agregasi per bulan (YYYY-MM) berdasarkan tanggal_lp
        const bulanExpr = sequelize.fn(
            "DATE_FORMAT",
            sequelize.col("LaporanPolisi.tanggal_lp"),
            "%Y-%m"
        );

        const rows = await LaporanPolisi.findAll({
            attributes: [
                [bulanExpr, "bulan"],
                [sequelize.fn("COUNT", sequelize.col("LaporanPolisi.id")), "total_lp"],
            ],
            where,
            include,
            group: [bulanExpr],
            order: [[bulanExpr, "ASC"]],
            raw: true,
        });

        const data = rows.map((row) => ({
            bulan: row.bulan, // "YYYY-MM"
            total_lp: parseInt(row.total_lp, 10) || 0,
        }));

        return successResponse(res, 200, "Tren bulanan retrieved successfully", data);
    } catch (error) {
        logger.error("Get tren bulanan error", error);
        return errorResponse(res, 500, "Failed to retrieve tren bulanan");
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/laporan-polisi/statistik/hari-kejadian
// Query params: from, to, polres_id, kecamatan_id
// Returns: total laporan berdasarkan hari kejadian
// ─────────────────────────────────────────────────────────────
const getStatistikHariKejadian = async (req, res) => {
    try {
        const { from, to, polres_id, kecamatan_id } = req.query;

        // Base filter untuk LaporanPolisi
        const whereLaporan = { is_active: true };

        if (from) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.gte]: from };
        if (to) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.lte]: to };
        if (polres_id && polres_id !== "ALL") {
            whereLaporan.polres_id = Number(polres_id);
        }
        if (kecamatan_id) whereLaporan.kecamatan_id = Number(kecamatan_id);

        const includeLaporan = [];
        if (req.user?.role === "user") {
            includeLaporan.push({
                model: Polres,
                as: "polres",
                attributes: [],
                where: { wilayah_id: req.user.wilayah_id },
                required: true,
            });
        }

        const result = await LaporanPolisi.findAll({
            attributes: [
                "hari_kejadian",
                [sequelize.fn("COUNT", sequelize.col("LaporanPolisi.id")), "total_laka"],
            ],
            where: whereLaporan,
            include: includeLaporan,
            group: ["hari_kejadian"],
            raw: true,
        });

        // Initialize with default 0 to ensure all days are present in specific order
        const defaultDays = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU"];
        const hariMap = {};
        defaultDays.forEach((hari) => {
            hariMap[hari] = 0;
        });

        result.forEach((row) => {
            if (row.hari_kejadian) {
                const hari = row.hari_kejadian.toUpperCase();
                if (hariMap[hari] !== undefined) {
                    hariMap[hari] = parseInt(row.total_laka, 10) || 0;
                }
            }
        });

        const data = defaultDays.map((hari) => ({
            hari: hari,
            total_laka: hariMap[hari],
        }));

        return successResponse(res, 200, "Statistik hari kejadian laka retrieved successfully", data);
    } catch (error) {
        logger.error("Get statistik hari kejadian laka error", error);
        return errorResponse(res, 500, "Failed to retrieve statistik hari kejadian laka");
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/laporan-polisi/statistik/top-10-polres-lp-terlama
// Query params: from, to, polres_id
// Returns: 10 Polres dengan rata-rata telat_lp terlama
// ─────────────────────────────────────────────────────────────
const getTop10PolresPenerbitanLPTerlama = async (req, res) => {
    try {
        const { from, to, polres_id } = req.query;

        // Base filter untuk LaporanPolisi
        const whereLaporan = { is_active: true };

        if (from) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.gte]: from };
        if (to) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.lte]: to };
        if (polres_id && polres_id !== "ALL") {
            whereLaporan.polres_id = Number(polres_id);
        }

        // Include Polres untuk mendaptkan nama polres
        const includePolres = {
            model: Polres,
            as: "polres",
            attributes: ["id", "nama"],
            required: true,
            include: [],
        };

        // Filter wilayah otomatis untuk user
        if (req.user?.role === "user") {
            includePolres.where = { wilayah_id: req.user.wilayah_id };
        }

        // Query agregasi: hitung rata-rata telat_lp per polres
        const result = await LaporanPolisi.findAll({
            attributes: [
                "polres_id",
                [sequelize.fn("AVG", sequelize.col("LaporanPolisi.telat_lp")), "rata_rata_telat"],
            ],
            where: whereLaporan,
            include: [includePolres],
            group: ["LaporanPolisi.polres_id", "polres.id", "polres.nama"],
            order: [[sequelize.literal("rata_rata_telat"), "DESC"]],
            limit: 10,
            raw: true,
        });

        // Format hasil agar mudah dibaca dan pembulatan 2 desimal
        const data = result.map((row) => ({
            polres_id: row.polres_id,
            nama_polres: row["polres.nama"] || row.nama,
            rata_rata_telat: parseFloat(row.rata_rata_telat || 0).toFixed(2),
        }));

        return successResponse(res, 200, "Top 10 Polres LP terlama retrieved successfully", data);
    } catch (error) {
        logger.error("Get top 10 Polres LP terlama error", error);
        return errorResponse(res, 500, "Failed to retrieve top 10 Polres LP terlama");
    }
};

module.exports = {
    getPerbandinganStatistik,
    getPerbandinganCidera,
    getTotalLakaPerWilayah,
    getTotalKorbanPerWilayah,
    getStatistikKasusTabrak,
    getStatistikKorbanByProfesi,
    getStatistikKorbanByJenisKendaraan,
    getTop20KecamatanLaka,
    getTop10PolresLaka,
    getTrenBulanan,
    getTop15RumahSakitKorban,
    getTrendHarianLPKorban,
    getStatistikHariKejadian,
    getTop10PolresPenerbitanLPTerlama
};


