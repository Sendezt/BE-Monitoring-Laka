// src/controllers/migrasi.controller.js
// Fitur Migrasi Data: baca Google Spreadsheet, cocokkan dgn Data Master,
// cek kesiapan insert, lalu import ke tabel LaporanPolisi + Kendaraan + Korban.

const sequelize = require("../config/database");

const {
    LaporanPolisi,
    Kendaraan,
    Korban,
    Kecamatan,
    Kelurahan,
    Polres,
    RumahSakit,
    TindakLanjut,
    JenisJaminan,
    Keterjaminan,
    SifatLaka,
    KasusTabrakKecelakaan,
    FaktorPenyebabLaka,
    JenisKendaraan,
    Profesi,
    Cidera,
    ActivityLog,
} = require("../models");

const { successResponse, errorResponse } = require("../utils/formatResponse");
const logger = require("../utils/logger");

const {
    HARI_MAPPING,
    KENDARAAN_KEYWORD_MAP,
    formatDate,
    formatMasaLakuSW,
    lookup,
    lookupId,
    lookupPolresIdByKecamatan,
    fetchSheetRows,
    fetchHeaderRows,
    detectColumnMapping,
    parseRows,
    groupByLp,
} = require("../utils/googleSheets");

const REQUIRED_FIELDS = [
    "no_lp",
    "polres_id",
    "tanggal_laka",
    "hari_kejadian",
    "tanggal_lp",
    "kecamatan_id",
    "kelurahan_id",
    "lokasi_laka",
];

// ─────────────────────────────────────────────────────────────
// Load semua master data dari DB (sekali per request)
// ─────────────────────────────────────────────────────────────
async function loadMasterData() {
    const opts = { where: { is_active: true }, raw: true };

    const [
        polres,
        kecamatan,
        kelurahan,
        rumahSakit,
        jenisKendaraan,
        profesi,
        cidera,
        tindakLanjut,
        jenisJaminan,
        keterjaminan,
        sifatLaka,
        faktorPenyebab,
        kasusTabrak,
    ] = await Promise.all([
        Polres.findAll({ ...opts, attributes: ["id", "nama", "wilayah_id"] }),
        Kecamatan.findAll({ ...opts, attributes: ["id", "nama", "polres_id"] }),
        Kelurahan.findAll({ ...opts, attributes: ["id", "nama", "kecamatan_id"] }),
        RumahSakit.findAll({ ...opts, attributes: ["id", "nama"] }),
        JenisKendaraan.findAll({ ...opts, attributes: ["id", "nama"] }),
        Profesi.findAll({ ...opts, attributes: ["id", "nama"] }),
        Cidera.findAll({ ...opts, attributes: ["id", "nama"] }),
        TindakLanjut.findAll({ ...opts, attributes: ["id", "nama"] }),
        JenisJaminan.findAll({ ...opts, attributes: ["id", "nama"] }),
        Keterjaminan.findAll({ ...opts, attributes: ["id", "nama"] }),
        SifatLaka.findAll({ ...opts, attributes: ["id", "nama"] }),
        FaktorPenyebabLaka.findAll({ ...opts, attributes: ["id", "nama"] }),
        KasusTabrakKecelakaan.findAll({ ...opts, attributes: ["id", "nama"] }),
    ]);

    return {
        polres,
        kecamatan,
        kelurahan,
        rumahSakit,
        jenisKendaraan,
        profesi,
        cidera,
        tindakLanjut,
        jenisJaminan,
        keterjaminan,
        sifatLaka,
        faktorPenyebab,
        kasusTabrak,
    };
}

// ─────────────────────────────────────────────────────────────
// Map 1 group LP → payload dengan ID + kumpulan issue mapping
// ─────────────────────────────────────────────────────────────
function mapGroupToPayload(group, master) {
    const laporan = group.laporan;
    const issues = []; // { field, value } → teks Excel yang tidak match master

    // Helper: cari nama master berdasarkan id
    const nameById = (arr, id) => {
        if (id == null) return null;
        const found = arr.find((item) => item.id === id);
        return found ? found.nama : null;
    };

    const tanggalLaka = formatDate(laporan.tanggal_laka);
    const tanggalLp = formatDate(laporan.tanggal_lp);

    if (!tanggalLaka) issues.push({ field: "tanggal_laka", value: laporan.tanggal_laka || "(kosong)" });
    if (!tanggalLp) issues.push({ field: "tanggal_lp", value: laporan.tanggal_lp || "(kosong)" });

    // Hari kejadian
    let hariKejadian = laporan.hari || laporan.hari_kejadian || "";
    const normalizedHari = hariKejadian.toString().toLowerCase().trim();
    hariKejadian = HARI_MAPPING[normalizedHari] || (tanggalLaka
        ? ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][new Date(tanggalLaka).getDay()]
        : null);

    // Kecamatan
    const kecamatanMatch = lookup(master.kecamatan, laporan.kecamatan);
    const kecamatanId = kecamatanMatch ? kecamatanMatch.id : null;
    if (!kecamatanId && laporan.kecamatan) issues.push({ field: "kecamatan", value: laporan.kecamatan });

    // Kelurahan
    const kelurahanId = lookupId(master.kelurahan, laporan.kelurahan);
    if (!kelurahanId && laporan.kelurahan) issues.push({ field: "kelurahan", value: laporan.kelurahan });

    // Rumah sakit (opsional)
    const rumahSakitId = lookupId(master.rumahSakit, laporan.rs_sendiri);
    if (!rumahSakitId && laporan.rs_sendiri) issues.push({ field: "rumah_sakit", value: laporan.rs_sendiri });

    // Polres: dari kecamatan yang termatch → polres_id
    let polresId = null;
    if (kecamatanMatch) polresId = kecamatanMatch.polres_id || null;
    if (!polresId) polresId = lookupPolresIdByKecamatan(master.kecamatan, laporan.kecamatan);
    if (!polresId && laporan.kecamatan) issues.push({ field: "polres", value: laporan.kecamatan });

    // Kasus tabrak (opsional, fallback ke item pertama)
    let kasusTabrakId = lookupId(master.kasusTabrak, laporan.kasus_tabrakan);
    if (!kasusTabrakId && laporan.kasus_tabrakan) {
        issues.push({ field: "kasus_tabrakan", value: laporan.kasus_tabrakan });
    }

    // Faktor penyebab (opsional)
    let faktorPenyebabId = lookupId(master.faktorPenyebab, laporan.faktor_penyebab);
    if (!faktorPenyebabId && laporan.faktor_penyebab) {
        issues.push({ field: "faktor_penyebab", value: laporan.faktor_penyebab });
    }

    // Sifat laka (opsional)
    let sifatLakaId = lookupId(master.sifatLaka, laporan.sifat_laka);
    if (!sifatLakaId && laporan.sifat_laka) {
        issues.push({ field: "sifat_laka", value: laporan.sifat_laka });
    }

    const payload = {
        no_lp: laporan.no_lp,
        polres_id: polresId,
        tanggal_laka: tanggalLaka,
        hari_kejadian: hariKejadian,
        tanggal_lp: tanggalLp,
        kecamatan_id: kecamatanId,
        kelurahan_id: kelurahanId,
        kelurahan_nama: laporan.kelurahan || null,
        lokasi_laka: laporan.lokasi_laka || "",
        rumah_sakit_id: rumahSakitId,
        rumah_sakit_wilayah: laporan.rs_lain || null,
        laka_tunggal: laporan.laka_tunggal === "TRUE" || laporan.laka_tunggal === "true",
        kasus_tabrak_kecelakaan_id: kasusTabrakId,
        faktor_penyebab_laka_id: faktorPenyebabId,
        sifat_laka_id: sifatLakaId,
        keterangan: laporan.keterangan || null,
        kendaraan: group.kendaraan.map((k) => {
            let jenisKendaraanId = lookupId(master.jenisKendaraan, k.jenis_kendaraan);
            if (!jenisKendaraanId) {
                const kw = KENDARAAN_KEYWORD_MAP[k.jenis_kendaraan];
                if (kw) jenisKendaraanId = lookupId(master.jenisKendaraan, kw);
            }
            if (!jenisKendaraanId) {
                const lainnya = master.jenisKendaraan.find(
                    (item) => item.nama && item.nama.toLowerCase().includes("lainnya")
                );
                jenisKendaraanId = lainnya ? lainnya.id : null;
            }
            if (!jenisKendaraanId && k.jenis_kendaraan) {
                issues.push({ field: "jenis_kendaraan", value: k.jenis_kendaraan });
            }
            return {
                peran: k.peran || "korban",
                jenis_kendaraan_id: jenisKendaraanId,
                jenis_kendaraan_nama: nameById(master.jenisKendaraan, jenisKendaraanId),
                nopol: k.nopol,
                masa_laku_sw: formatMasaLakuSW(k.masa_laku_sw),
            };
        }),
        korban: group.korban.map((k) => {
            const profesiId = lookupId(master.profesi, k.profesi);
            const cideraId = lookupId(master.cidera, k.cidera);
            const tindakLanjutId = lookupId(master.tindakLanjut, k.tindak_lanjut);
            const jenisJaminanId = lookupId(master.jenisJaminan, k.jenis_jaminan);
            const keterjaminanId = lookupId(master.keterjaminan, k.keterjaminan);
            return {
                nama: k.nama,
                usia: parseInt(k.usia) || null,
                profesi_id: profesiId,
                profesi_nama: nameById(master.profesi, profesiId),
                cidera_id: cideraId,
                cidera_nama: nameById(master.cidera, cideraId),
                kendaraan_index: k.kendaraan_index,
                tindak_lanjut_id: tindakLanjutId,
                tindak_lanjut_nama: nameById(master.tindakLanjut, tindakLanjutId),
                jenis_jaminan_id: jenisJaminanId,
                jenis_jaminan_nama: nameById(master.jenisJaminan, jenisJaminanId),
                keterjaminan_id: keterjaminanId,
                keterjaminan_nama: nameById(master.keterjaminan, keterjaminanId),
            };
        }),
    };

    // Label master untuk level laporan (memudahkan verifikasi manual di UI)
    payload.labels = {
        polres: nameById(master.polres, polresId),
        kecamatan: kecamatanMatch ? kecamatanMatch.nama : null,
        kelurahan: nameById(master.kelurahan, kelurahanId),
        rumah_sakit: nameById(master.rumahSakit, rumahSakitId),
        kasus_tabrak_kecelakaan: nameById(master.kasusTabrak, kasusTabrakId),
        faktor_penyebab_laka: nameById(master.faktorPenyebab, faktorPenyebabId),
        sifat_laka: nameById(master.sifatLaka, sifatLakaId),
    };

    return { payload, issues };
}

// ─────────────────────────────────────────────────────────────
// Validasi field wajib pada payload
// ─────────────────────────────────────────────────────────────
function getMissingFields(payload) {
    const missing = [];
    for (const field of REQUIRED_FIELDS) {
        const value = payload[field];
        if (value === null || value === undefined || value === "") {
            missing.push(field);
        }
    }
    return missing;
}

// ─────────────────────────────────────────────────────────────
// Insert 1 payload LP → DB (transaksional). Reusable.
// ─────────────────────────────────────────────────────────────
async function insertLaporanPayload(payload, req) {
    const t = await sequelize.transaction();
    try {
        const diffMs = new Date(payload.tanggal_lp) - new Date(payload.tanggal_laka);
        const telat_lp = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

        const laporanPolisi = await LaporanPolisi.create(
            {
                no_lp: String(payload.no_lp).trim(),
                polres_id: Number(payload.polres_id),
                tanggal_laka: payload.tanggal_laka,
                hari_kejadian: String(payload.hari_kejadian).trim(),
                tanggal_lp: payload.tanggal_lp,
                telat_lp,
                kecamatan_id: Number(payload.kecamatan_id),
                kelurahan_id: Number(payload.kelurahan_id),
                lokasi_laka: String(payload.lokasi_laka).trim(),
                rumah_sakit_id: payload.rumah_sakit_id ? Number(payload.rumah_sakit_id) : null,
                rumah_sakit_wilayah: payload.rumah_sakit_wilayah ?? null,
                laka_tunggal: payload.laka_tunggal ?? false,
                kasus_tabrak_kecelakaan_id: payload.kasus_tabrak_kecelakaan_id
                    ? Number(payload.kasus_tabrak_kecelakaan_id) : null,
                faktor_penyebab_laka_id: payload.faktor_penyebab_laka_id
                    ? Number(payload.faktor_penyebab_laka_id) : null,
                sifat_laka_id: payload.sifat_laka_id ? Number(payload.sifat_laka_id) : null,
                keterangan: payload.keterangan ?? null,
                user_id: req.user?.id || null,
                is_active: true,
            },
            { transaction: t }
        );

        // Kendaraan
        const kendaraanIndexMap = {};
        const kendaraanArr = Array.isArray(payload.kendaraan) ? payload.kendaraan : [];
        for (let i = 0; i < kendaraanArr.length; i++) {
            const k = kendaraanArr[i];
            const newKendaraan = await Kendaraan.create(
                {
                    laporan_polisi_id: laporanPolisi.id,
                    peran: k.peran,
                    jenis_kendaraan_id: k.jenis_kendaraan_id ? Number(k.jenis_kendaraan_id) : null,
                    nopol: k.nopol ? String(k.nopol).trim() : null,
                    masa_laku_sw: k.masa_laku_sw || null,
                    is_active: true,
                },
                { transaction: t }
            );
            kendaraanIndexMap[i] = newKendaraan.id;
        }

        // Korban
        const korbanArr = Array.isArray(payload.korban) ? payload.korban : [];
        for (const krb of korbanArr) {
            const resolvedKendaraanId =
                krb.kendaraan_index !== undefined && krb.kendaraan_index !== null
                    ? kendaraanIndexMap[krb.kendaraan_index] ?? null
                    : null;
            await Korban.create(
                {
                    laporan_polisi_id: laporanPolisi.id,
                    nama: String(krb.nama || "").trim(),
                    usia: krb.usia ? Number(krb.usia) : null,
                    profesi_id: krb.profesi_id ? Number(krb.profesi_id) : null,
                    cidera_id: krb.cidera_id ? Number(krb.cidera_id) : null,
                    kendaraan_id: resolvedKendaraanId,
                    tindak_lanjut_id: krb.tindak_lanjut_id ? Number(krb.tindak_lanjut_id) : null,
                    jenis_jaminan_id: krb.jenis_jaminan_id ? Number(krb.jenis_jaminan_id) : null,
                    keterjaminan_id: krb.keterjaminan_id ? Number(krb.keterjaminan_id) : null,
                    is_active: true,
                },
                { transaction: t }
            );
        }

        // Activity log
        try {
            const userStr = req.user
                ? (req.user.nama_lengkap || req.user.username) + " (" + req.user.role + ")"
                : "Sistem";
            await ActivityLog.create(
                {
                    aksi: "CREATE",
                    tabel: "laporan_polisi",
                    record_id: laporanPolisi.id,
                    data_lama: null,
                    data_baru: JSON.stringify(laporanPolisi.toJSON()),
                    ip_address: req.ip || req.headers["x-forwarded-for"] || null,
                    waktu: new Date(),
                    user_id: req.user?.id || null,
                    deskripsi: `${userStr} mengimpor data laporan polisi #${laporanPolisi.id} dari Google Sheets`,
                },
                { transaction: t }
            );
        } catch (logErr) {
            logger.error("Activity log error (migrasi import)", logErr);
        }

        await t.commit();
        return laporanPolisi;
    } catch (error) {
        await t.rollback();
        throw error;
    }
}

// ─────────────────────────────────────────────────────────────
// GET /api/migrasi/sheets?sheet=1&startRow=6&endRow=50
// Baca sheet, map ke payload + status validasi + cek duplikat No LP
// ─────────────────────────────────────────────────────────────
const getSheetData = async (req, res) => {
    try {
        const sheetName = (req.query.sheet || "1").toString();
        const startRow = parseInt(req.query.startRow, 10) || 6;
        const endRow = parseInt(req.query.endRow, 10) || 50;

        const [master, rows, headerRows] = await Promise.all([
            loadMasterData(),
            fetchSheetRows(sheetName, startRow, endRow),
            fetchHeaderRows(sheetName, 4, 5).catch(() => []),
        ]);

        if (!rows || rows.length === 0) {
            return successResponse(res, 200, "Tidak ada data pada sheet ini", {
                sheet: sheetName,
                rows: [],
            });
        }

        // Deteksi mapping kolom dari header (menangani sheet yang kolomnya bergeser).
        // Bila deteksi gagal, gunakan mapping statis default.
        const dynamicMapping = detectColumnMapping(headerRows);
        const parsed = parseRows(rows, startRow, dynamicMapping || undefined);
        const grouped = groupByLp(parsed);

        // No LP yang sudah ada di DB — cek duplikat berbasis (no_lp + polres_id).
        // No LP yang sama boleh ada di polres berbeda; yang dilarang hanya
        // kombinasi no_lp + polres_id yang sama persis.
        const noLpList = Object.keys(grouped);
        const existing = await LaporanPolisi.findAll({
            where: { no_lp: noLpList, is_active: true },
            attributes: ["no_lp", "polres_id"],
            raw: true,
        });
        const existingSet = new Set(existing.map((e) => `${e.no_lp}|${e.polres_id}`));

        // Urutkan sesuai urutan fisik baris di sheet (No LP pertama muncul = tampil pertama)
        const sortedKeys = noLpList.sort(
            (a, b) => (grouped[a].laporan._baris || 0) - (grouped[b].laporan._baris || 0)
        );

        const resultRows = sortedKeys.map((noLp) => {
            const group = grouped[noLp];
            const { payload, issues } = mapGroupToPayload(group, master);
            const missing = getMissingFields(payload);
            // Duplikat hanya jika polres_id termapping DAN kombinasi sudah ada
            const duplicate =
                payload.polres_id != null &&
                existingSet.has(`${noLp}|${payload.polres_id}`);

            let status = "VALID";
            if (missing.length > 0 || issues.length > 0) status = "INVALID_MASTER";
            if (duplicate) status = "DUPLICATE";

            return {
                no_lp: noLp,
                nomor_urut: group.laporan.nomor_urut || 0,
                status,
                duplicate,
                missing_fields: missing,
                issues,
                raw: group.laporan,
                payload,
            };
        });

        return successResponse(res, 200, "Data sheet berhasil diambil", {
            sheet: sheetName,
            start_row: startRow,
            end_row: endRow,
            total: resultRows.length,
            rows: resultRows,
        });
    } catch (error) {
        logger.error("Get sheet data error", error);
        const detail = error?.response?.data?.error?.message || error.message;
        return errorResponse(res, 500, "Gagal mengambil data dari Google Sheets", detail);
    }
};

// ─────────────────────────────────────────────────────────────
// POST /api/migrasi/check
// Body: { payload } atau { no_lp }
// Re-validasi mapping master + cek duplikat No LP di DB
// ─────────────────────────────────────────────────────────────
const checkRow = async (req, res) => {
    try {
        const { payload } = req.body;

        if (!payload || !payload.no_lp) {
            return errorResponse(res, 400, "payload dengan no_lp wajib dikirim");
        }

        const missing = getMissingFields(payload);

        // Duplikat berbasis (no_lp + polres_id): No LP yang sama boleh di polres
        // berbeda, hanya kombinasi yang sama persis yang dianggap duplikat.
        let duplicate = false;
        if (payload.polres_id != null) {
            const existing = await LaporanPolisi.findOne({
                where: {
                    no_lp: String(payload.no_lp).trim(),
                    polres_id: Number(payload.polres_id),
                    is_active: true,
                },
                attributes: ["id"],
            });
            duplicate = !!existing;
        }

        const insertable = missing.length === 0 && !duplicate;

        let status = "VALID";
        if (missing.length > 0) status = "INVALID_MASTER";
        if (duplicate) status = "DUPLICATE";

        return successResponse(res, 200, "Hasil pengecekan baris", {
            no_lp: payload.no_lp,
            status,
            insertable,
            duplicate,
            missing_fields: missing,
        });
    } catch (error) {
        logger.error("Check row error", error);
        return errorResponse(res, 500, "Gagal memeriksa baris");
    }
};

// ─────────────────────────────────────────────────────────────
// POST /api/migrasi/import
// Body: { payload }  → insert 1 LP (grouped) ke DB
// ─────────────────────────────────────────────────────────────
const importRow = async (req, res) => {
    try {
        const { payload, createMissingMaster = false } = req.body;

        if (!payload || !payload.no_lp) {
            return errorResponse(res, 400, "payload dengan no_lp wajib dikirim");
        }

        // --- 1. Penanganan kelurahan jika hilang (SEBELUM validasi) ---
        if (!payload.kelurahan_id && payload.kelurahan_nama) {
            if (!createMissingMaster) {
                return errorResponse(
                    res,
                    400,
                    `Kelurahan "${payload.kelurahan_nama}" tidak ditemukan. Silakan tambahkan ke master terlebih dahulu atau kirim flag createMissingMaster=true`
                );
            }
            const kecamatanId = payload.kecamatan_id;
            if (!kecamatanId) {
                return errorResponse(res, 400, "Kecamatan tidak ditemukan, tidak dapat membuat kelurahan");
            }
            const [newKel] = await Kelurahan.findOrCreate({
                where: {
                    nama: payload.kelurahan_nama.trim(),
                    kecamatan_id: kecamatanId,
                },
                defaults: { is_active: true },
            });
            payload.kelurahan_id = newKel.id; // set ID agar insert berhasil
        }

        // --- 2. Validasi field wajib (sekarang kelurahan_id sudah terisi) ---
        const missing = getMissingFields(payload);
        if (missing.length > 0) {
            return errorResponse(
                res,
                400,
                `Data tidak lengkap. Field wajib kosong: ${missing.join(", ")}`
            );
        }

        // --- 3. Cek duplikat ---
        const existing = await LaporanPolisi.findOne({
            where: {
                no_lp: String(payload.no_lp).trim(),
                polres_id: Number(payload.polres_id),
                is_active: true,
            },
            attributes: ["id"],
        });
        if (existing) {
            return errorResponse(
                res,
                409,
                `No LP "${payload.no_lp}" sudah ada di polres ini (ID #${existing.id})`
            );
        }

        const laporan = await insertLaporanPayload(payload, req);
        const result = await LaporanPolisi.findByPk(laporan.id);
        return successResponse(res, 201, "Baris berhasil diimpor ke database", result);
    } catch (error) {
        logger.error("Import row error", error);
        return errorResponse(res, 500, "Gagal mengimpor baris ke database");
    }
};

module.exports = {
    getSheetData,
    checkRow,
    importRow,
};
