// src/controllers/laporanPolisi.controller.js
const { Op } = require("sequelize");
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
    Wilayah,
    Cidera,
    ActivityLog,
} = require("../models");

const {
    successResponse,
    errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// ─────────────────────────────────────────────────────────────
// Helper: catat activity log
// ─────────────────────────────────────────────────────────────
const logActivity = async (aksi, tabel, record_id, data_lama, data_baru, req, t, customDeskripsi) => {
    try {
        let deskripsi = customDeskripsi;
        if (!deskripsi) {
            const userStr = req.user ? (req.user.nama_lengkap || req.user.username) + " (" + req.user.role + ")" : "Sistem";
            const actionStr = aksi === "CREATE" ? "membuat" : aksi === "UPDATE" ? "memperbarui" : aksi === "DELETE" ? "menghapus" : aksi;
            const tableStr = tabel.replace(/_/g, " ");
            deskripsi = userStr + " " + actionStr + " data " + tableStr + " #" + record_id;
        }
        await ActivityLog.create(
            {
                aksi,
                tabel,
                record_id,
                data_lama: data_lama ? JSON.stringify(data_lama) : null,
                data_baru: data_baru ? JSON.stringify(data_baru) : null,
                ip_address: req.ip || req.headers["x-forwarded-for"] || null,
                waktu: new Date(),
                user_id: req.user?.id || null,
                deskripsi,
            },
            { transaction: t }
        );
    } catch (err) {
        logger.error("Activity log error", err);
    }
};

// ─────────────────────────────────────────────────────────────
// Helper: include untuk GET /:id (nested detail)
// ─────────────────────────────────────────────────────────────
const detailInclude = [
    {
        model: Polres,
        as: "polres",
        attributes: ["id", "nama"],
    },
    {
        model: Kecamatan,
        as: "kecamatan",
        attributes: ["id", "nama"],
    },
    {
        model: Kelurahan,
        as: "kelurahan",
        attributes: ["id", "nama"],
    },
    {
        model: RumahSakit,
        as: "rumahSakit",
        attributes: ["id", "nama"],
    },

    {
        model: SifatLaka,
        as: "sifatLaka",
        attributes: ["id", "nama"],
    },
    {
        model: KasusTabrakKecelakaan,
        as: "kasusTabrakKecelakaan",
        attributes: ["id", "nama"],
    },
    {
        model: FaktorPenyebabLaka,
        as: "faktorPenyebabLaka",
        attributes: ["id", "nama"],
    },
    {
        model: Kendaraan,
        as: "kendaraan",
        where: { is_active: true },
        required: false,
        attributes: ["id", "peran", "nopol", "masa_laku_sw", "jenis_kendaraan_id"],
        include: [
            {
                model: JenisKendaraan,
                as: "jenisKendaraan",
                attributes: ["id", "nama"],
            },
        ],
    },
    {
        model: Korban,
        as: "korban",
        where: { is_active: true },
        required: false,
        attributes: ["id", "nama", "usia", "kendaraan_id", "profesi_id", "cidera_id", "tindak_lanjut_id", "jenis_jaminan_id", "keterjaminan_id"],
        include: [
            {
                model: Profesi,
                as: "profesi",
                attributes: ["id", "nama"],
            },
            {
                model: Cidera,
                as: "cidera",
                attributes: ["id", "nama"],
            },
            {
                model: TindakLanjut,
                as: "tindakLanjut",
                attributes: ["id", "nama"],
            },
            {
                model: JenisJaminan,
                as: "jenisJaminan",
                attributes: ["id", "nama"],
            },
            {
                model: Keterjaminan,
                as: "keterjaminan",
                attributes: ["id", "nama"],
            },
        ],
    },
];

// ─────────────────────────────────────────────────────────────
// GET /api/laporan-polisi
// Query params: from, to, no_lp, kecamatan_id, page, limit
// ─────────────────────────────────────────────────────────────
const getLaporanPolisi = async (req, res) => {
    try {
        const { from, to, no_lp, kecamatan_id, polres_id, page = 1, limit = 10, sort_by = 'tanggal_laka', sort_dir = 'DESC' } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (pageNum - 1) * limitNum;

        // Base filter
        const where = { is_active: true };

        if (from) where.tanggal_lp = { ...where.tanggal_lp, [Op.gte]: from };
        if (to) where.tanggal_lp = { ...where.tanggal_lp, [Op.lte]: to };
        if (no_lp) where.no_lp = { [Op.like]: `%${String(no_lp).trim()}%` };
        if (kecamatan_id) where.kecamatan_id = Number(kecamatan_id);
        if (polres_id) where.polres_id = Number(polres_id);

        // Scope wilayah otomatis untuk user
        const includeKecamatan = {
            model: Kecamatan,
            as: "kecamatan",
            attributes: ["id", "nama"],
        };

        if (req.user?.role === "user") {
            includeKecamatan.required = true;
            includeKecamatan.include = [
                {
                    model: require("../models/Polres"),
                    as: "polres",
                    attributes: [],
                    where: { wilayah_id: req.user.wilayah_id },
                    required: true,
                },
            ];
        }

        const includes = detailInclude.map(inc => {
            if (inc.as === "kecamatan") return includeKecamatan;
            return inc;
        });

        const { count, rows } = await LaporanPolisi.findAndCountAll({
            where,
            include: includes,
            order: [[sort_by, sort_dir.toUpperCase() === "ASC" ? "ASC" : "DESC"]],
            limit: limitNum,
            offset,
            distinct: true,
        });

        return successResponse(
            res,
            200,
            "Laporan polisi retrieved successfully",
            rows,
            {
                total: count,
                page: pageNum,
                limit: limitNum,
                total_pages: Math.ceil(count / limitNum),
            }
        );
    } catch (error) {
        logger.error("Get laporan polisi error", error);
        return errorResponse(res, 500, "Failed to retrieve laporan polisi");
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/laporan-polisi/:id (nested detail)
// ─────────────────────────────────────────────────────────────
const getLaporanPolisiById = async (req, res) => {
    try {
        const { id } = req.params;

        const laporanPolisi = await LaporanPolisi.findOne({
            where: { id, is_active: true },
            include: detailInclude,
        });

        if (!laporanPolisi) {
            return errorResponse(res, 404, "Laporan polisi not found");
        }

        // Scope wilayah untuk user
        if (req.user?.role === "user") {
            const kecamatan = await Kecamatan.findByPk(laporanPolisi.kecamatan_id, {
                include: [{ model: require("../models/Polres"), as: "polres", attributes: ["wilayah_id"] }],
            });
            if (!kecamatan || kecamatan.polres?.wilayah_id !== req.user.wilayah_id) {
                return errorResponse(res, 403, "Anda tidak memiliki akses ke wilayah lain");
            }
        }

        return successResponse(
            res,
            200,
            "Laporan polisi retrieved successfully",
            laporanPolisi
        );
    } catch (error) {
        logger.error("Get laporan polisi by ID error", error);
        return errorResponse(res, 500, "Failed to retrieve laporan polisi");
    }
};

// ─────────────────────────────────────────────────────────────
// POST /api/laporan-polisi (All-in-One Transactional)
// Payload: { ...laporan, kendaraan: [...], korban: [...] }
// ─────────────────────────────────────────────────────────────
const createLaporanPolisi = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const {
            no_lp,
            polres_id,
            tanggal_laka,
            hari_kejadian,
            tanggal_lp,
            kecamatan_id,
            kelurahan_id,
            lokasi_laka,
            rumah_sakit_id,
            rumah_sakit_wilayah,
            laka_tunggal,
            kasus_tabrak_kecelakaan_id,
            faktor_penyebab_laka_id,
            sifat_laka_id,
            keterangan,
            kendaraan = [],
            korban = [],
        } = req.body;

        // Validasi field wajib
        if (
            !no_lp ||
            polres_id === undefined || polres_id === null ||
            !tanggal_laka ||
            !hari_kejadian ||
            !tanggal_lp ||
            kecamatan_id === undefined || kecamatan_id === null ||
            kelurahan_id === undefined || kelurahan_id === null ||
            !lokasi_laka
        ) {
            await t.rollback();
            return errorResponse(
                res,
                400,
                "no_lp, polres_id, tanggal_laka, hari_kejadian, tanggal_lp, kecamatan_id, kelurahan_id, dan lokasi_laka wajib diisi"
            );
        }

        // ── Otorisasi scope wilayah (role user) ──────────────────────
        // User (petugas) hanya boleh membuat laporan pada polres di wilayahnya
        // sendiri. Admin bebas. Cegah pembuatan data lintas wilayah.
        if (req.user?.role === "user") {
            const polres = await Polres.findByPk(Number(polres_id), {
                attributes: ["id", "wilayah_id"],
            });
            if (!polres || polres.wilayah_id !== req.user.wilayah_id) {
                await t.rollback();
                return errorResponse(
                    res,
                    403,
                    "Anda hanya dapat membuat laporan untuk polres di wilayah Anda sendiri"
                );
            }
        }

        // Hitung telat_lp otomatis dari selisih hari
        const diffMs = new Date(tanggal_lp) - new Date(tanggal_laka);
        const telat_lp = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

        // 1. Insert LaporanPolisi
        const laporanPolisi = await LaporanPolisi.create(
            {
                no_lp: String(no_lp).trim(),
                polres_id: Number(polres_id),
                tanggal_laka,
                hari_kejadian: String(hari_kejadian).trim(),
                tanggal_lp,
                telat_lp,
                kecamatan_id: Number(kecamatan_id),
                kelurahan_id: Number(kelurahan_id),
                lokasi_laka: String(lokasi_laka).trim(),
                rumah_sakit_id: rumah_sakit_id ? Number(rumah_sakit_id) : null,
                rumah_sakit_wilayah: rumah_sakit_wilayah ?? null,
                laka_tunggal: laka_tunggal ?? false,
                kasus_tabrak_kecelakaan_id: kasus_tabrak_kecelakaan_id ? Number(kasus_tabrak_kecelakaan_id) : null,
                faktor_penyebab_laka_id: faktor_penyebab_laka_id ? Number(faktor_penyebab_laka_id) : null,
                sifat_laka_id: sifat_laka_id ? Number(sifat_laka_id) : null,
                keterangan: keterangan ?? null,
                user_id: req.user?.id || null,
                is_active: true,
            },
            { transaction: t }
        );

        // 2. Insert Kendaraan[] — petakan index ke DB ID
        const kendaraanIndexMap = {}; // { index: kendaraan_id }
        for (let i = 0; i < kendaraan.length; i++) {
            const k = kendaraan[i];
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

        // 3. Insert Korban[] — resolusi kendaraan_index ke kendaraan_id
        const savedKorban = [];
        for (const krb of korban) {
            const resolvedKendaraanId =
                krb.kendaraan_index !== undefined && krb.kendaraan_index !== null
                    ? kendaraanIndexMap[krb.kendaraan_index] ?? null
                    : null;

            const newKorban = await Korban.create(
                {
                    laporan_polisi_id: laporanPolisi.id,
                    nama: String(krb.nama).trim(),
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
            savedKorban.push(newKorban);
        }

        // 4. Activity Log
        await logActivity(
            "CREATE",
            "laporan_polisi",
            laporanPolisi.id,
            null,
            laporanPolisi.toJSON(),
            req,
            t
        );

        await t.commit();

        // Ambil data lengkap dengan nested untuk response
        const result = await LaporanPolisi.findOne({
            where: { id: laporanPolisi.id },
            include: detailInclude,
        });

        return successResponse(
            res,
            201,
            "Laporan polisi, kendaraan, dan korban created successfully",
            result
        );
    } catch (error) {
        await t.rollback();
        logger.error("Create laporan polisi error", error);
        return errorResponse(res, 500, "Failed to create laporan polisi");
    }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/laporan-polisi/:id
// ─────────────────────────────────────────────────────────────
const updateLaporanPolisi = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;

        const laporanPolisi = await LaporanPolisi.findOne({
            where: { id, is_active: true },
        });

        if (!laporanPolisi) {
            await t.rollback();
            return errorResponse(res, 404, "Laporan polisi not found");
        }

        // Scope wilayah untuk user
        if (req.user?.role === "user") {
            const kecamatan = await Kecamatan.findByPk(laporanPolisi.kecamatan_id, {
                include: [{ model: require("../models/Polres"), as: "polres", attributes: ["wilayah_id"] }],
            });
            if (!kecamatan || kecamatan.polres?.wilayah_id !== req.user.wilayah_id) {
                await t.rollback();
                return errorResponse(res, 403, "Anda tidak memiliki akses ke wilayah lain");
            }
        }

        const {
            no_lp, polres_id, tanggal_laka, hari_kejadian, tanggal_lp,
            kecamatan_id, kelurahan_id, lokasi_laka,
            rumah_sakit_id, rumah_sakit_wilayah, laka_tunggal,
            kasus_tabrak_kecelakaan_id, faktor_penyebab_laka_id,
            sifat_laka_id, keterangan,
            kendaraan: kendaraanPayload,
            korban: korbanPayload,
        } = req.body;

        const dataLama = laporanPolisi.toJSON();

        // Otorisasi: bila user (bukan admin) mengubah polres_id, polres baru
        // harus tetap berada di wilayahnya sendiri (cegah pindah lintas wilayah).
        if (req.user?.role === "user" && polres_id && Number(polres_id) !== laporanPolisi.polres_id) {
            const polresBaru = await Polres.findByPk(Number(polres_id), {
                attributes: ["id", "wilayah_id"],
            });
            if (!polresBaru || polresBaru.wilayah_id !== req.user.wilayah_id) {
                await t.rollback();
                return errorResponse(
                    res,
                    403,
                    "Anda hanya dapat memindahkan laporan ke polres di wilayah Anda sendiri"
                );
            }
        }

        // Hitung ulang telat_lp jika tanggal berubah
        const newTanggalLaka = tanggal_laka ?? laporanPolisi.tanggal_laka;
        const newTanggalLp = tanggal_lp ?? laporanPolisi.tanggal_lp;
        const diffMs = new Date(newTanggalLp) - new Date(newTanggalLaka);
        const newTelatLp = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

        await laporanPolisi.update(
            {
                no_lp: no_lp ? String(no_lp).trim() : laporanPolisi.no_lp,
                polres_id: polres_id ? Number(polres_id) : laporanPolisi.polres_id,
                tanggal_laka: tanggal_laka ?? laporanPolisi.tanggal_laka,
                hari_kejadian: hari_kejadian ? String(hari_kejadian).trim() : laporanPolisi.hari_kejadian,
                tanggal_lp: tanggal_lp ?? laporanPolisi.tanggal_lp,
                telat_lp: newTelatLp,
                kecamatan_id: kecamatan_id ? Number(kecamatan_id) : laporanPolisi.kecamatan_id,
                kelurahan_id: kelurahan_id ? Number(kelurahan_id) : laporanPolisi.kelurahan_id,
                lokasi_laka: lokasi_laka ? String(lokasi_laka).trim() : laporanPolisi.lokasi_laka,
                rumah_sakit_id: rumah_sakit_id !== undefined ? (rumah_sakit_id ? Number(rumah_sakit_id) : null) : laporanPolisi.rumah_sakit_id,
                rumah_sakit_wilayah: rumah_sakit_wilayah !== undefined ? rumah_sakit_wilayah : laporanPolisi.rumah_sakit_wilayah,
                laka_tunggal: laka_tunggal ?? laporanPolisi.laka_tunggal,
                kasus_tabrak_kecelakaan_id: kasus_tabrak_kecelakaan_id !== undefined ? (kasus_tabrak_kecelakaan_id ? Number(kasus_tabrak_kecelakaan_id) : null) : laporanPolisi.kasus_tabrak_kecelakaan_id,
                faktor_penyebab_laka_id: faktor_penyebab_laka_id !== undefined ? (faktor_penyebab_laka_id ? Number(faktor_penyebab_laka_id) : null) : laporanPolisi.faktor_penyebab_laka_id,
                sifat_laka_id: sifat_laka_id !== undefined ? (sifat_laka_id ? Number(sifat_laka_id) : null) : laporanPolisi.sifat_laka_id,
                keterangan: keterangan !== undefined ? keterangan : laporanPolisi.keterangan,
            },
            { transaction: t }
        );

        // ── Upsert Kendaraan ──────────────────────────────────
        const kendaraanIndexMap = {}; // { index → kendaraan_id }

        if (Array.isArray(kendaraanPayload)) {
            // Soft-delete semua kendaraan lama, lalu buat ulang
            await Kendaraan.update(
                { is_active: false },
                { where: { laporan_polisi_id: laporanPolisi.id }, transaction: t }
            );
            for (let i = 0; i < kendaraanPayload.length; i++) {
                const k = kendaraanPayload[i];
                const savedK = await Kendaraan.create(
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
                kendaraanIndexMap[i] = savedK.id;
            }
        } else {
            // Bangun map dari kendaraan yang sudah ada (urutan insert awal)
            const existingKendaraan = await Kendaraan.findAll({
                where: { laporan_polisi_id: laporanPolisi.id, is_active: true },
                order: [["id", "ASC"]],
                transaction: t,
            });
            existingKendaraan.forEach((k, i) => { kendaraanIndexMap[i] = k.id; });
        }

        // ── Upsert Korban ─────────────────────────────────────
        if (Array.isArray(korbanPayload)) {
            // Soft-delete semua korban lama, lalu buat ulang
            await Korban.update(
                { is_active: false },
                { where: { laporan_polisi_id: laporanPolisi.id }, transaction: t }
            );
            for (const krb of korbanPayload) {
                const resolvedKendaraanId =
                    krb.kendaraan_index !== undefined && krb.kendaraan_index !== null
                        ? kendaraanIndexMap[krb.kendaraan_index] ?? null
                        : null;
                await Korban.create(
                    {
                        laporan_polisi_id: laporanPolisi.id,
                        nama: String(krb.nama).trim(),
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
        }

        await logActivity(
            "UPDATE",
            "laporan_polisi",
            laporanPolisi.id,
            dataLama,
            laporanPolisi.toJSON(),
            req,
            t
        );

        await t.commit();

        const updated = await LaporanPolisi.findOne({
            where: { id: laporanPolisi.id },
            include: detailInclude,
        });

        return successResponse(
            res,
            200,
            "Laporan polisi updated successfully",
            updated
        );
    } catch (error) {
        await t.rollback();
        logger.error("Update laporan polisi error", error);
        return errorResponse(res, 500, "Failed to update laporan polisi");
    }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/laporan-polisi/:id (admin only, cascade soft delete)
// ─────────────────────────────────────────────────────────────
const deleteLaporanPolisi = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;

        const laporanPolisi = await LaporanPolisi.findOne({
            where: { id, is_active: true },
        });

        if (!laporanPolisi) {
            await t.rollback();
            return errorResponse(res, 404, "Laporan polisi not found");
        }

        const dataLama = laporanPolisi.toJSON();

        // Cascade soft delete: laporan → kendaraan → korban (1 transaksi)
        await Korban.update(
            { is_active: false },
            { where: { laporan_polisi_id: id }, transaction: t }
        );

        await Kendaraan.update(
            { is_active: false },
            { where: { laporan_polisi_id: id }, transaction: t }
        );

        await laporanPolisi.update(
            { is_active: false },
            { transaction: t }
        );

        await logActivity(
            "DELETE",
            "laporan_polisi",
            laporanPolisi.id,
            dataLama,
            null,
            req,
            t
        );

        await t.commit();

        return successResponse(
            res,
            200,
            "Laporan polisi deleted successfully",
            null
        );
    } catch (error) {
        await t.rollback();
        logger.error("Delete laporan polisi error", error);
        return errorResponse(res, 500, "Failed to delete laporan polisi");
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/laporan-polisi/statistik/komparasi
// Query params: start1, end1, start2, end2
// ─────────────────────────────────────────────────────────────
const getStatistikKomparasi = async (req, res) => {
    try {
        const { start1, end1, start2, end2 } = req.query;

        if (!start1 || !end1 || !start2 || !end2) {
            return errorResponse(
                res,
                400,
                "Parameter start1, end1, start2, end2 wajib diisi (format: YYYY-MM-DD)"
            );
        }

        const baseWhere = { is_active: true };

        // Query 2 periode secara parallel (COUNT di DB)
        const [p1Result, p2Result] = await Promise.all([
            LaporanPolisi.findAll({
                attributes: [
                    [sequelize.fn("COUNT", sequelize.col("LaporanPolisi.id")), "total_laka"],
                    [sequelize.fn("SUM", sequelize.literal("CASE WHEN laka_tunggal = 1 THEN 1 ELSE 0 END")), "laka_tunggal"],
                ],
                include: [
                    {
                        model: Korban,
                        as: "korban",
                        attributes: [],
                        where: { is_active: true },
                        required: false,
                    },
                ],
                where: {
                    ...baseWhere,
                    tanggal_laka: { [Op.between]: [start1, end1] },
                },
                raw: true,
            }),
            LaporanPolisi.findAll({
                attributes: [
                    [sequelize.fn("COUNT", sequelize.col("LaporanPolisi.id")), "total_laka"],
                    [sequelize.fn("SUM", sequelize.literal("CASE WHEN laka_tunggal = 1 THEN 1 ELSE 0 END")), "laka_tunggal"],
                ],
                include: [
                    {
                        model: Korban,
                        as: "korban",
                        attributes: [],
                        where: { is_active: true },
                        required: false,
                    },
                ],
                where: {
                    ...baseWhere,
                    tanggal_laka: { [Op.between]: [start2, end2] },
                },
                raw: true,
            }),
        ]);

        // Hitung total korban per periode secara parallel
        const [totalKorban1, totalKorban2] = await Promise.all([
            Korban.count({
                include: [
                    {
                        model: LaporanPolisi,
                        as: "laporanPolisi",
                        where: {
                            is_active: true,
                            tanggal_laka: { [Op.between]: [start1, end1] },
                        },
                        required: true,
                        attributes: [],
                    },
                ],
                where: { is_active: true },
            }),
            Korban.count({
                include: [
                    {
                        model: LaporanPolisi,
                        as: "laporanPolisi",
                        where: {
                            is_active: true,
                            tanggal_laka: { [Op.between]: [start2, end2] },
                        },
                        required: true,
                        attributes: [],
                    },
                ],
                where: { is_active: true },
            }),
        ]);

        const formatTanggal = (d) =>
            new Date(d).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });

        const totalLaka1 = parseInt(p1Result[0]?.total_laka || 0, 10);
        const totalLaka2 = parseInt(p2Result[0]?.total_laka || 0, 10);
        const lakaTunggal1 = parseInt(p1Result[0]?.laka_tunggal || 0, 10);
        const lakaTunggal2 = parseInt(p2Result[0]?.laka_tunggal || 0, 10);

        const selisihLaka = totalLaka2 - totalLaka1;
        const selisihKorban = totalKorban2 - totalKorban1;

        const persentaseLaka =
            totalLaka1 === 0
                ? "N/A"
                : `${((selisihLaka / totalLaka1) * 100).toFixed(2)}%`;
        const persentaseKorban =
            totalKorban1 === 0
                ? "N/A"
                : `${((selisihKorban / totalKorban1) * 100).toFixed(2)}%`;

        let keterangan = "Tidak ada perubahan angka kecelakaan.";
        if (selisihLaka < 0) {
            keterangan = `Terjadi penurunan angka kecelakaan sebesar ${Math.abs(parseFloat(persentaseLaka))}% dibanding periode sebelumnya.`;
        } else if (selisihLaka > 0) {
            keterangan = `Terjadi kenaikan angka kecelakaan sebesar ${parseFloat(persentaseLaka)}% dibanding periode sebelumnya.`;
        }

        return successResponse(res, 200, "Statistik komparasi berhasil diambil", {
            periode_1: {
                rentang: `${formatTanggal(start1)} - ${formatTanggal(end1)}`,
                total_laka: totalLaka1,
                total_korban: totalKorban1,
                laka_tunggal: lakaTunggal1,
            },
            periode_2: {
                rentang: `${formatTanggal(start2)} - ${formatTanggal(end2)}`,
                total_laka: totalLaka2,
                total_korban: totalKorban2,
                laka_tunggal: lakaTunggal2,
            },
            komparasi: {
                selisih_laka: selisihLaka,
                persentase_laka: persentaseLaka,
                selisih_korban: selisihKorban,
                persentase_korban: persentaseKorban,
                keterangan,
            },
        });
    } catch (error) {
        logger.error("Statistik komparasi error", error);
        return errorResponse(res, 500, "Failed to retrieve statistik komparasi");
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/laporan-polisi/status-lp
// Query params: from, to, polres_id, kecamatan_id
// Returns: total_terlambat (telat_lp > 0) & total_normal (telat_lp = 0)
// ─────────────────────────────────────────────────────────────
const getStatusLP = async (req, res) => {
    try {
        const { from, to, polres_id, kecamatan_id } = req.query;

        // Base where (shared filters)
        const baseWhere = { is_active: true };

        if (from) baseWhere.tanggal_lp = { ...baseWhere.tanggal_lp, [Op.gte]: from };
        if (to) baseWhere.tanggal_lp = { ...baseWhere.tanggal_lp, [Op.lte]: to };
        if (kecamatan_id) baseWhere.kecamatan_id = Number(kecamatan_id);
        if (polres_id) baseWhere.polres_id = Number(polres_id);

        const include = [];

        // Scope wilayah otomatis untuk user
        if (req.user?.role === "user") {
            include.push({
                model: Polres,
                as: "polres",
                attributes: [],
                where: { wilayah_id: req.user.wilayah_id },
                required: true,
            });
        }

        // Jalankan kedua query secara parallel
        const [totalTerlambat, totalNormal] = await Promise.all([
            LaporanPolisi.count({
                where: { ...baseWhere, telat_lp: { [Op.gt]: 0 } },
                include,
            }),
            LaporanPolisi.count({
                where: { ...baseWhere, telat_lp: 0 },
                include,
            }),
        ]);

        const total = totalTerlambat + totalNormal;
        const persentaseTerlambat = total > 0
            ? `${((totalTerlambat / total) * 100).toFixed(2)}%`
            : "0.00%";
        const persentaseNormal = total > 0
            ? `${((totalNormal / total) * 100).toFixed(2)}%`
            : "0.00%";

        return successResponse(res, 200, "Status LP retrieved successfully", {
            total,
            total_terlambat: totalTerlambat,
            persentase_terlambat: persentaseTerlambat,
            total_normal: totalNormal,
            persentase_normal: persentaseNormal,
        });
    } catch (error) {
        logger.error("Get status LP error", error);
        return errorResponse(res, 500, "Failed to retrieve status LP");
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/laporan-polisi/breakdown-terlambat
// Query params: from, to, polres_id, kecamatan_id
// Returns: breakdown 1-3 hari, 4-7 hari, >7 hari + persentase
// ─────────────────────────────────────────────────────────────
const getBreakdownTerlambat = async (req, res) => {
    try {
        const { from, to, polres_id, kecamatan_id } = req.query;

        // Base where (shared filters — hanya yg terlambat)
        const baseWhere = {
            is_active: true,
            telat_lp: { [Op.gt]: 0 },
        };

        if (from) baseWhere.tanggal_lp = { ...baseWhere.tanggal_lp, [Op.gte]: from };
        if (to) baseWhere.tanggal_lp = { ...baseWhere.tanggal_lp, [Op.lte]: to };
        if (kecamatan_id) baseWhere.kecamatan_id = Number(kecamatan_id);
        if (polres_id) baseWhere.polres_id = Number(polres_id);

        const include = [];

        // Scope wilayah otomatis untuk user
        if (req.user?.role === "user") {
            include.push({
                model: Polres,
                as: "polres",
                attributes: [],
                where: { wilayah_id: req.user.wilayah_id },
                required: true,
            });
        }

        // Jalankan 3 query secara parallel
        const [terlambat1_3, terlambat4_7, terlambatLebih7] = await Promise.all([
            LaporanPolisi.count({
                where: { ...baseWhere, telat_lp: { [Op.between]: [1, 3] } },
                include,
            }),
            LaporanPolisi.count({
                where: { ...baseWhere, telat_lp: { [Op.between]: [4, 7] } },
                include,
            }),
            LaporanPolisi.count({
                where: { ...baseWhere, telat_lp: { [Op.gt]: 7 } },
                include,
            }),
        ]);

        const totalTerlambat = terlambat1_3 + terlambat4_7 + terlambatLebih7;

        const persen = (val) =>
            totalTerlambat > 0
                ? `${((val / totalTerlambat) * 100).toFixed(2)}%`
                : "0.00%";

        return successResponse(res, 200, "Breakdown terlambat retrieved successfully", {
            total_terlambat: totalTerlambat,
            terlambat_1_3_hari: terlambat1_3,
            persentase_1_3_hari: persen(terlambat1_3),
            terlambat_4_7_hari: terlambat4_7,
            persentase_4_7_hari: persen(terlambat4_7),
            terlambat_lebih_7_hari: terlambatLebih7,
            persentase_lebih_7_hari: persen(terlambatLebih7),
        });
    } catch (error) {
        logger.error("Get breakdown terlambat error", error);
        return errorResponse(res, 500, "Failed to retrieve breakdown terlambat");
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/laporan-polisi/statistik/jenis-laka
// Query params: from, to, polres_id, kecamatan_id
// Returns: total laka tunggal & non-tunggal
// ─────────────────────────────────────────────────────────────
const getStatistikJenisLaka = async (req, res) => {
    try {
        const { from, to, polres_id, kecamatan_id } = req.query;

        // Base filter
        const baseWhere = {
            is_active: true,
        };

        if (from) {
            baseWhere.tanggal_lp = {
                ...baseWhere.tanggal_lp,
                [Op.gte]: from,
            };
        }

        if (to) {
            baseWhere.tanggal_lp = {
                ...baseWhere.tanggal_lp,
                [Op.lte]: to,
            };
        }

        if (polres_id) {
            baseWhere.polres_id = Number(polres_id);
        }

        if (kecamatan_id) {
            baseWhere.kecamatan_id = Number(kecamatan_id);
        }

        // Scope wilayah otomatis untuk user
        const include = [];

        if (req.user?.role === "user") {
            include.push({
                model: Polres,
                as: "polres",
                attributes: [],
                where: {
                    wilayah_id: req.user.wilayah_id,
                },
                required: true,
            });
        }

        // Jalankan count secara parallel
        const [totalLakaTunggal, totalLakaNonTunggal] = await Promise.all([
            LaporanPolisi.count({
                where: {
                    ...baseWhere,
                    laka_tunggal: true,
                },
                include,
            }),

            LaporanPolisi.count({
                where: {
                    ...baseWhere,
                    laka_tunggal: false,
                },
                include,
            }),
        ]);

        const totalLaka = totalLakaTunggal + totalLakaNonTunggal;

        const persentaseTunggal =
            totalLaka > 0
                ? `${((totalLakaTunggal / totalLaka) * 100).toFixed(2)}%`
                : "0.00%";

        const persentaseNonTunggal =
            totalLaka > 0
                ? `${((totalLakaNonTunggal / totalLaka) * 100).toFixed(2)}%`
                : "0.00%";

        return successResponse(
            res,
            200,
            "Statistik jenis laka retrieved successfully",
            {
                total_laka: totalLaka,

                laka_tunggal: {
                    total: totalLakaTunggal,
                    persentase: persentaseTunggal,
                },

                laka_non_tunggal: {
                    total: totalLakaNonTunggal,
                    persentase: persentaseNonTunggal,
                },
            }
        );
    } catch (error) {
        logger.error("Get statistik jenis laka error", error);

        return errorResponse(
            res,
            500,
            "Failed to retrieve statistik jenis laka"
        );
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/laporan-polisi/statistik/korban
// Query params: from, to, polres_id, kecamatan_id
// Returns: total korban & breakdown cidera LL, LL-MD, MD
// ─────────────────────────────────────────────────────────────
const getStatistikKorban = async (req, res) => {
    try {
        const { from, to, polres_id, kecamatan_id } = req.query;

        // Base filter untuk LaporanPolisi
        const baseWhere = { is_active: true };

        if (from) baseWhere.tanggal_lp = { ...baseWhere.tanggal_lp, [Op.gte]: from };
        if (to) baseWhere.tanggal_lp = { ...baseWhere.tanggal_lp, [Op.lte]: to };
        if (polres_id) baseWhere.polres_id = Number(polres_id);
        if (kecamatan_id) baseWhere.kecamatan_id = Number(kecamatan_id);

        // Scope wilayah untuk user (include ke Polres melalui LaporanPolisi)
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

        // Helper: hitung korban dengan filter laporan + filter cidera_id
        const countKorbanWithCidera = async (cideraIds) => {
            if (!cideraIds || cideraIds.length === 0) return 0;
            return Korban.count({
                where: {
                    is_active: true,
                    cidera_id: { [Op.in]: cideraIds },
                },
                include: [
                    {
                        model: LaporanPolisi,
                        as: "laporanPolisi",
                        where: baseWhere,
                        required: true,
                        attributes: [],
                        include: includePolres, // nested include untuk filter wilayah
                    },
                ],
            });
        };

        // Ambil id cidera berdasarkan nama (asumsi nama persis)
        const namaCidera = ["LL", "LL-MD", "MD"];
        const cideraRecords = await Cidera.findAll({
            where: { nama: { [Op.in]: namaCidera } },
            attributes: ["id", "nama"],
            raw: true,
        });

        // Kelompokkan id per kategori
        const idByNama = {};
        for (const nama of namaCidera) {
            idByNama[nama] = cideraRecords
                .filter(c => c.nama === nama)
                .map(c => c.id);
        }

        // Hitung total korban keseluruhan (tanpa filter cidera)
        const totalKorban = await countKorbanWithCidera(null); // null berarti tanpa filter cidera_id
        // Sebenarnya fungsi di atas memerlukan array, kita buat fungsi terpisah untuk total
        const totalKorbanCount = await Korban.count({
            where: { is_active: true },
            include: [
                {
                    model: LaporanPolisi,
                    as: "laporanPolisi",
                    where: baseWhere,
                    required: true,
                    attributes: [],
                    include: includePolres,
                },
            ],
        });

        // Hitung masing-masing kategori
        const totalLL = await countKorbanWithCidera(idByNama["LL"] || []);
        const totalLLMD = await countKorbanWithCidera(idByNama["LL-MD"] || []);
        const totalMD = await countKorbanWithCidera(idByNama["MD"] || []);

        // Hitung persentase
        const persen = (val) =>
            totalKorbanCount > 0
                ? `${((val / totalKorbanCount) * 100).toFixed(2)}%`
                : "0.00%";

        return successResponse(res, 200, "Statistik korban retrieved successfully", {
            total_korban: totalKorbanCount,
            cidera_LL: {
                total: totalLL,
                persentase: persen(totalLL),
            },
            cidera_LL_MD: {
                total: totalLLMD,
                persentase: persen(totalLLMD),
            },
            cidera_MD: {
                total: totalMD,
                persentase: persen(totalMD),
            },
        });
    } catch (error) {
        logger.error("Get statistik korban error", error);
        return errorResponse(res, 500, "Failed to retrieve statistik korban");
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/laporan-polisi/statistik/keterjaminan
// Query params: from, to, polres_id, kecamatan_id
// Returns: total korban & distribusi keterjaminan beserta persentase
// ─────────────────────────────────────────────────────────────
const getStatistikKeterjaminan = async (req, res) => {
    try {
        const { from, to, polres_id, kecamatan_id } = req.query;

        // Filter untuk LaporanPolisi (sebagai parent)
        const whereLaporan = { is_active: true };
        if (from) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.gte]: from };
        if (to) whereLaporan.tanggal_lp = { ...whereLaporan.tanggal_lp, [Op.lte]: to };
        if (polres_id) whereLaporan.polres_id = Number(polres_id);
        if (kecamatan_id) whereLaporan.kecamatan_id = Number(kecamatan_id);

        // Scope wilayah untuk user — filter via LaporanPolisi -> Polres
        const includePolresInLP = [];
        if (req.user?.role === "user") {
            includePolresInLP.push({
                model: Polres,
                as: "polres",
                attributes: [],
                where: { wilayah_id: req.user.wilayah_id },
                required: true,
            });
        }

        // Include LaporanPolisi dengan filter tanggal/polres/wilayah
        const includeLaporan = {
            model: LaporanPolisi,
            as: "laporanPolisi",
            where: whereLaporan,
            attributes: [],
            required: true,
            include: includePolresInLP,
        };

        // Fungsi helper: hitung korban dengan keterjaminan_id tertentu
        const countKorbanByKeterjaminan = async (keterjaminanId) => {
            const whereKorban = { is_active: true };
            if (keterjaminanId !== null && keterjaminanId !== undefined) {
                whereKorban.keterjaminan_id = keterjaminanId;
            } else {
                whereKorban.keterjaminan_id = { [Op.is]: null };
            }
            return Korban.count({
                where: whereKorban,
                include: [includeLaporan],
            });
        };

        // 1. Total seluruh korban yang memenuhi filter (denominator)
        const totalKorban = await Korban.count({
            where: { is_active: true },
            include: [includeLaporan],
        });

        // 2. Ambil semua keterjaminan aktif
        const keterjaminanList = await Keterjaminan.findAll({
            where: { is_active: true },
            attributes: ["id", "nama"],
            order: [["id", "ASC"]],
            raw: true,
        });

        // 3. Hitung jumlah korban untuk masing-masing keterjaminan secara paralel
        const counts = await Promise.all(
            keterjaminanList.map((k) => countKorbanByKeterjaminan(k.id))
        );

        // 4. Hitung korban tanpa keterjaminan (null)
        const totalTanpaKeterjaminan = await countKorbanByKeterjaminan(null);

        // 5. Susun data respons
        const rincianKeterjaminan = keterjaminanList.map((k, index) => {
            const total = counts[index];
            return {
                id: k.id,
                nama: k.nama,
                total,
                persentase: totalKorban > 0 ? `${((total / totalKorban) * 100).toFixed(2)}%` : "0.00%",
            };
        });

        const data = {
            total_korban: totalKorban,
            rincian_keterjaminan: rincianKeterjaminan,
            tanpa_keterjaminan: {
                total: totalTanpaKeterjaminan,
                persentase: totalKorban > 0 ? `${((totalTanpaKeterjaminan / totalKorban) * 100).toFixed(2)}%` : "0.00%",
            },
        };

        return successResponse(res, 200, "Statistik keterjaminan retrieved successfully", data);
    } catch (error) {
        logger.error("Get statistik keterjaminan error", error);
        return errorResponse(res, 500, "Failed to retrieve statistik keterjaminan");
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// REKAPITULASI CONTROLLER (appended)
// ─────────────────────────────────────────────────────────────────────────────

function _createEmptyRekapRow(id, nama, wilayah) {
  return {
    id, nama, kode_loket: '', wilayah,
    jumlah_lp: 0, terlambat_lapor: 0, jumlah_korban: 0, laka_tunggal: 0,
    ll: 0, ll_md: 0, md: 0,
    terjamin: 0, eg2r: 0, tidak_terjamin: 0,
    kt_depan_depan: 0, kt_depan_samping: 0, kt_depan_belakang: 0,
    kt_belakang_samping: 0, kt_samping_samping: 0, kt_beruntun: 0,
    kt_ka: 0, kt_pjk: 0, kt_jatuh_sendiri: 0, kt_ka_pjk: 0,
    pf_pelajar: 0, pf_karyawan: 0, pf_wiraswasta: 0, pf_pns: 0, pf_pedagang: 0,
    pf_buruh: 0, pf_pensiunan: 0, pf_guru: 0, pf_petani: 0, pf_rumah_tangga: 0,
    pf_tidak_bekerja: 0, pf_supir: 0, pf_lainnya: 0,
    jk_a: 0, jk_b: 0, jk_c1: 0, jk_c2: 0, jk_dp: 0, jk_du: 0, jk_ep: 0, jk_eu: 0,
    jk_f: 0, jk_ka: 0, jk_sepeda: 0, jk_pjk: 0, jk_tabrak_lari: 0,
    telat_1_3: 0, telat_4_7: 0, telat_lebih_7: 0,
  };
}

function _aggregateRekapRow(row, l) {
  row.jumlah_lp += 1;
  if (l.telat_lp > 0) row.terlambat_lapor += 1;
  if (l.laka_tunggal) row.laka_tunggal += 1;
  if (l.telat_lp >= 1 && l.telat_lp <= 3) row.telat_1_3 += 1;
  else if (l.telat_lp >= 4 && l.telat_lp <= 7) row.telat_4_7 += 1;
  else if (l.telat_lp > 7) row.telat_lebih_7 += 1;

  const kt = (l.kasusTabrakKecelakaan && l.kasusTabrakKecelakaan.nama ? l.kasusTabrakKecelakaan.nama : '').toLowerCase();
  if (kt.includes('depan - depan')) row.kt_depan_depan += 1;
  else if (kt.includes('depan - samping')) row.kt_depan_samping += 1;
  else if (kt.includes('depan - belakang')) row.kt_depan_belakang += 1;
  else if (kt.includes('belakang - samping')) row.kt_belakang_samping += 1;
  else if (kt.includes('samping - samping')) row.kt_samping_samping += 1;
  else if (kt.includes('beruntun')) row.kt_beruntun += 1;
  else if (kt.includes('kereta api') || kt.includes('dengan ka')) row.kt_ka += 1;
  else if (kt.includes('menabrak pjk') || (kt.includes('pjk') && kt.includes('tabrak'))) row.kt_pjk += 1;
  else if (kt.includes('jatuh sendiri')) row.kt_jatuh_sendiri += 1;
  else if (kt.includes('ka - pjk') || kt.includes('ka pjk')) row.kt_ka_pjk += 1;

  const korbanList = l.korban || [];
  row.jumlah_korban += korbanList.length;

  korbanList.forEach(k => {
    const cname = ((k.cidera && k.cidera.nama) ? k.cidera.nama : '').toLowerCase();
    if (cname === 'll' || cname === 'luka luka' || cname === 'luka ringan' || cname.includes('luka luka')) row.ll += 1;
    else if (cname.includes('ll-md') || cname.includes('ll md') || cname.includes('luka luka') && cname.includes('meninggal')) row.ll_md += 1;
    else if (cname === 'md' || cname.includes('meninggal')) row.md += 1;

    const kname = ((k.keterjaminan && k.keterjaminan.nama) ? k.keterjaminan.nama : '').toLowerCase();
    if (kname === 'eg2r' || kname.includes('eg2r')) row.eg2r += 1;
    else if (kname.includes('tidak terjamin') || kname.includes('tidak')) row.tidak_terjamin += 1;
    else if (kname.includes('terjamin')) row.terjamin += 1;

    const pname = ((k.profesi && k.profesi.nama) ? k.profesi.nama : '').toLowerCase();
    if (pname.includes('pelajar') || pname.includes('mahasiswa')) row.pf_pelajar += 1;
    else if (pname.includes('karyawan') || pname.includes('swasta')) row.pf_karyawan += 1;
    else if (pname.includes('wiraswasta') || pname.includes('wirausaha')) row.pf_wiraswasta += 1;
    else if (pname.includes('pns') || pname.includes('bumn')) row.pf_pns += 1;
    else if (pname.includes('pedagang')) row.pf_pedagang += 1;
    else if (pname.includes('buruh')) row.pf_buruh += 1;
    else if (pname.includes('pensiunan')) row.pf_pensiunan += 1;
    else if (pname.includes('guru')) row.pf_guru += 1;
    else if (pname.includes('petani') || pname.includes('pekebun')) row.pf_petani += 1;
    else if (pname.includes('rumah tangga')) row.pf_rumah_tangga += 1;
    else if (pname.includes('tidak bekerja')) row.pf_tidak_bekerja += 1;
    else if (pname.includes('supir') || pname.includes('driver')) row.pf_supir += 1;
    else row.pf_lainnya += 1;
  });

  const kendaraanList = (l.kendaraan || []).filter(k => k.peran === 'korban');
  kendaraanList.forEach(k => {
    const jkname = ((k.jenisKendaraan && k.jenisKendaraan.nama) ? k.jenisKendaraan.nama : '').trim().toUpperCase();
    if (jkname === 'A') row.jk_a += 1;
    else if (jkname === 'B') row.jk_b += 1;
    else if (jkname === 'C1') row.jk_c1 += 1;
    else if (jkname === 'C2') row.jk_c2 += 1;
    else if (jkname === 'DP') row.jk_dp += 1;
    else if (jkname === 'DU') row.jk_du += 1;
    else if (jkname === 'EP') row.jk_ep += 1;
    else if (jkname === 'EU') row.jk_eu += 1;
    else if (jkname === 'F') row.jk_f += 1;
    else if (jkname === 'KA' || jkname.includes('KERETA')) row.jk_ka += 1;
    else if (jkname.includes('SEPEDA') && !jkname.includes('MOTOR')) row.jk_sepeda += 1;
    else if (jkname.includes('PJK')) row.jk_pjk += 1;
    else row.jk_tabrak_lari += 1;
  });
}

const getRekapitulasiPolres = async (req, res) => {
  try {
    const { from, to, polres_id } = req.query;
    const baseWhere = { is_active: true };
    if (from) baseWhere.tanggal_lp = { ...baseWhere.tanggal_lp, [Op.gte]: from };
    if (to) baseWhere.tanggal_lp = { ...baseWhere.tanggal_lp, [Op.lte]: to };
    if (polres_id && polres_id !== 'ALL') baseWhere.polres_id = Number(polres_id);

    let polresScope = { is_active: true };
    if (req.user && req.user.role === 'user') polresScope.wilayah_id = req.user.wilayah_id;

    const allPolres = await Polres.findAll({
      where: polresScope,
      include: [{ model: Wilayah, as: 'wilayah', attributes: ['id', 'nama'] }],
      order: [['nama', 'ASC']],
    });

    const laporan = await LaporanPolisi.findAll({
      where: baseWhere,
      include: [
        { model: Korban, as: 'korban', where: { is_active: true }, required: false,
          include: [
            { model: Cidera, as: 'cidera', attributes: ['id', 'nama'], required: false },
            { model: Keterjaminan, as: 'keterjaminan', attributes: ['id', 'nama'], required: false },
            { model: Profesi, as: 'profesi', attributes: ['id', 'nama'], required: false },
          ]
        },
        { model: Kendaraan, as: 'kendaraan', where: { is_active: true }, required: false,
          include: [{ model: JenisKendaraan, as: 'jenisKendaraan', attributes: ['id', 'nama'], required: false }]
        },
        { model: KasusTabrakKecelakaan, as: 'kasusTabrakKecelakaan', attributes: ['id', 'nama'], required: false },
        { model: Polres, as: 'polres', attributes: ['id', 'nama', 'wilayah_id'], required: false,
          include: [{ model: Wilayah, as: 'wilayah', attributes: ['id', 'nama'], required: false }]
        },
      ],
    });

    const polresMap = {};
    allPolres.forEach(p => {
      polresMap[p.id] = _createEmptyRekapRow(p.id, p.nama, p.wilayah ? p.wilayah.nama : '');
    });

    laporan.forEach(l => {
      const pid = l.polres_id;
      if (!polresMap[pid]) {
        polresMap[pid] = _createEmptyRekapRow(pid, l.polres ? l.polres.nama : 'Polres #' + pid, l.polres && l.polres.wilayah ? l.polres.wilayah.nama : '');
      }
      _aggregateRekapRow(polresMap[pid], l);
    });

    const rows = Object.values(polresMap).sort((a, b) => a.nama.localeCompare(b.nama));
    const totals = rows.reduce((acc, row) => {
      Object.keys(row).forEach(k => {
        if (typeof row[k] === 'number') acc[k] = (acc[k] || 0) + row[k];
      });
      return acc;
    }, { id: 0, nama: 'TOTAL', kode_loket: '', wilayah: '' });

    return successResponse(res, 200, 'Rekapitulasi per Polres berhasil diambil', { rows, totals });
  } catch (err) {
    logger.error('getRekapitulasiPolres error', err);
    return errorResponse(res, 500, 'Gagal mengambil data rekapitulasi per Polres', err.message);
  }
};

const getRekapitulasiLoket = async (req, res) => {
  try {
    const { from, to, polres_id } = req.query;
    const baseWhere = { is_active: true };
    if (from) baseWhere.tanggal_lp = { ...baseWhere.tanggal_lp, [Op.gte]: from };
    if (to) baseWhere.tanggal_lp = { ...baseWhere.tanggal_lp, [Op.lte]: to };
    if (polres_id && polres_id !== 'ALL') baseWhere.polres_id = Number(polres_id);

    let wilayahScope = { is_active: true };
    if (req.user && req.user.role === 'user') wilayahScope.id = req.user.wilayah_id;

    const allWilayah = await Wilayah.findAll({ where: wilayahScope, order: [['nama', 'ASC']] });

    const laporan = await LaporanPolisi.findAll({
      where: baseWhere,
      include: [
        { model: Korban, as: 'korban', where: { is_active: true }, required: false,
          include: [
            { model: Cidera, as: 'cidera', attributes: ['id', 'nama'], required: false },
            { model: Keterjaminan, as: 'keterjaminan', attributes: ['id', 'nama'], required: false },
            { model: Profesi, as: 'profesi', attributes: ['id', 'nama'], required: false },
          ]
        },
        { model: Kendaraan, as: 'kendaraan', where: { is_active: true }, required: false,
          include: [{ model: JenisKendaraan, as: 'jenisKendaraan', attributes: ['id', 'nama'], required: false }]
        },
        { model: KasusTabrakKecelakaan, as: 'kasusTabrakKecelakaan', attributes: ['id', 'nama'], required: false },
        { model: Polres, as: 'polres', attributes: ['id', 'nama', 'wilayah_id'], required: false,
          include: [{ model: Wilayah, as: 'wilayah', attributes: ['id', 'nama'], required: false }]
        },
      ],
    });

    const wilayahMap = {};
    allWilayah.forEach(w => { wilayahMap[w.id] = _createEmptyRekapRow(w.id, w.nama, ''); });

    laporan.forEach(l => {
      const wid = l.polres ? l.polres.wilayah_id : null;
      if (!wid) return;
      if (!wilayahMap[wid]) {
        wilayahMap[wid] = _createEmptyRekapRow(wid, l.polres && l.polres.wilayah ? l.polres.wilayah.nama : 'Loket #' + wid, '');
      }
      _aggregateRekapRow(wilayahMap[wid], l);
    });

    const rows = Object.values(wilayahMap).sort((a, b) => a.nama.localeCompare(b.nama));
    const totals = rows.reduce((acc, row) => {
      Object.keys(row).forEach(k => {
        if (typeof row[k] === 'number') acc[k] = (acc[k] || 0) + row[k];
      });
      return acc;
    }, { id: 0, nama: 'TOTAL', kode_loket: '', wilayah: '' });

    return successResponse(res, 200, 'Rekapitulasi per Loket berhasil diambil', { rows, totals });
  } catch (err) {
    logger.error('getRekapitulasiLoket error', err);
    return errorResponse(res, 500, 'Gagal mengambil data rekapitulasi per Loket', err.message);
  }
};

module.exports = {
    getLaporanPolisi,
    getLaporanPolisiById,
    createLaporanPolisi,
    updateLaporanPolisi,
    deleteLaporanPolisi,
    getStatistikKomparasi,
    getStatusLP,
    getBreakdownTerlambat,
    getStatistikJenisLaka,
    getStatistikKorban,
    getStatistikKeterjaminan,
    getRekapitulasiPolres,
    getRekapitulasiLoket,
    // Helper rekap diekspor agar dapat dipakai ulang oleh modul export (read-only).
    _createEmptyRekapRow,
    _aggregateRekapRow,
    detailInclude,
};
