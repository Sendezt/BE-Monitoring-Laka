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
    stringSimilarity,
    lookup,
    lookupId,
    lookupExactOnly,
    lookupFuzzyOnly,
    findKelurahanInText,
    lookupPolresIdByKecamatan,
    fetchSheetRows,
    fetchHeaderRows,
    fetchTopBlock,
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
        RumahSakit.findAll({ ...opts, attributes: ["id", "nama", "wilayah_id"] }),
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
// Deteksi polres sebuah sheet secara OTOMATIS (1 sheet = 1 polres).
// Strategi berlapis:
//   1. Baca judul sheet (baris 1-3) → cari "POLRES XXX" cocokkan ke master.
//   2. Voting: cocokkan kecamatan tiap LP ke master, polres terbanyak menang.
// Mengembalikan { polresId, source }.
// ─────────────────────────────────────────────────────────────
function detectSheetPolres(titleRows, grouped, master) {
    // Normalisasi nama polres: buang prefix (polres/polresta/polrestabes),
    // titik, "kab", spasi berlebih → sisakan nama kotanya saja.
    const cleanPolresName = (s) =>
        (s || "")
            .toString()
            .toLowerCase()
            .replace(/polrestabes|polresta|polres/g, "")
            .replace(/kab\.?|kabupaten|kota/g, "")
            .replace(/[^a-z\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    // ── Strategi 1: VOTING kecamatan (paling andal & otoritatif) ──
    // kecamatan.polres_id di DB pasti benar, dan mayoritas menang sehingga
    // tahan terhadap beberapa kecamatan yang ambigu/salah ketik.
    // Juga bisa membedakan polres di kota yang sama (mis. Polresta Magelang
    // vs Polres Kab.Magelang) karena kecamatannya berbeda.
    const votes = {};
    for (const noLp of Object.keys(grouped)) {
        const kecText = grouped[noLp].laporan.kecamatan;
        if (!kecText) continue;
        const kec = lookup(master.kecamatan, kecText);
        if (kec && kec.polres_id) {
            votes[kec.polres_id] = (votes[kec.polres_id] || 0) + 1;
        }
    }
    let winnerId = null;
    let winnerVotes = 0;
    let totalVotes = 0;
    for (const [pid, v] of Object.entries(votes)) {
        totalVotes += v;
        if (v > winnerVotes) {
            winnerVotes = v;
            winnerId = parseInt(pid, 10);
        }
    }
    // Terima hasil voting bila cukup meyakinkan (mayoritas jelas)
    if (winnerId && winnerVotes >= 2) {
        return { polresId: winnerId, source: `voting kecamatan (${winnerVotes}/${totalVotes} LP)` };
    }

    // ── Strategi 2: judul sheet (cadangan bila voting lemah) ──
    const titleText = (titleRows || [])
        .flat()
        .map((c) => (c || "").toString())
        .join(" ");
    const m = titleText.match(/polres(?:tabes|ta)?\s*\.?\s*([a-z][a-z.\s]*)/i);
    if (m) {
        const namaKandidat = cleanPolresName(m[1]);
        if (namaKandidat) {
            let best = null;
            let bestScore = 0;
            for (const p of master.polres) {
                const namaMaster = cleanPolresName(p.nama);
                const score = stringSimilarity(namaKandidat, namaMaster);
                if (score > bestScore && score >= 0.8) {
                    bestScore = score;
                    best = p;
                }
            }
            if (best) return { polresId: best.id, source: `judul sheet ("${m[0].trim()}")` };
        }
    }

    // Fallback terakhir: pemenang voting walau cuma 1 suara
    if (winnerId) {
        return { polresId: winnerId, source: `voting kecamatan (${winnerVotes}/${totalVotes} LP)` };
    }

    return { polresId: null, source: "gagal deteksi" };
}

// ─────────────────────────────────────────────────────────────
// Map 1 group LP → payload dengan ID + kumpulan issue mapping
// ─────────────────────────────────────────────────────────────
function mapGroupToPayload(group, master, forcedPolresId = null) {
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

    // Kecamatan — bila polres dipaksa (1 sheet = 1 polres), batasi pencarian
    // kecamatan HANYA ke kecamatan milik polres itu. Ini mencegah salah match
    // ke kecamatan bernama sama di polres lain (mis. "Bawang" di Banjarnegara
    // padahal ini sheet Batang).
    const kecamatanPool = forcedPolresId
        ? master.kecamatan.filter((k) => k.polres_id === forcedPolresId)
        : master.kecamatan;
    const kecamatanMatch = lookup(kecamatanPool, laporan.kecamatan);
    const kecamatanId = kecamatanMatch ? kecamatanMatch.id : null;
    if (!kecamatanId && laporan.kecamatan) issues.push({ field: "kecamatan", value: laporan.kecamatan });

    // Kelurahan — urutan prioritas (dari paling meyakinkan):
    //  1. Exact match teks kelurahan (dalam scope kecamatan → global)
    //  2. Nama kelurahan yang PERSIS muncul di teks Lokasi Laka
    //     (lebih dipercaya daripada tebakan fuzzy yang bisa salah)
    //  3. Fuzzy match teks kelurahan (dalam scope kecamatan → global)
    const kelurahanScope = kecamatanId
        ? master.kelurahan.filter((k) => k.kecamatan_id === kecamatanId)
        : master.kelurahan;

    let kelurahanMatch = null;
    let kelurahanFromLokasi = false;

    // 1. Exact
    kelurahanMatch = lookupExactOnly(kelurahanScope, laporan.kelurahan);
    if (!kelurahanMatch && kecamatanId) {
        kelurahanMatch = lookupExactOnly(master.kelurahan, laporan.kelurahan);
    }

    // 2. Deteksi dari Lokasi Laka (nama kelurahan tercantum di alamat)
    if (!kelurahanMatch && laporan.lokasi_laka) {
        kelurahanMatch = findKelurahanInText(kelurahanScope, laporan.lokasi_laka);
        if (!kelurahanMatch && kecamatanId) {
            kelurahanMatch = findKelurahanInText(master.kelurahan, laporan.lokasi_laka);
        }
        if (kelurahanMatch) kelurahanFromLokasi = true;
    }

    // 3. Fuzzy match teks kelurahan (paling akhir, confidence terendah)
    if (!kelurahanMatch) {
        kelurahanMatch = lookupFuzzyOnly(kelurahanScope, laporan.kelurahan);
        if (!kelurahanMatch && kecamatanId) {
            kelurahanMatch = lookupFuzzyOnly(master.kelurahan, laporan.kelurahan);
        }
    }

    const kelurahanId = kelurahanMatch ? kelurahanMatch.id : null;
    if (!kelurahanId && laporan.kelurahan) issues.push({ field: "kelurahan", value: laporan.kelurahan });

    // Rumah sakit (opsional) — batasi ke RS milik wilayah polres sheet.
    // RS berelasi ke wilayah (bukan polres), jadi ambil wilayah_id dari polres.
    const forcedPolres = forcedPolresId
        ? master.polres.find((p) => p.id === forcedPolresId)
        : null;
    const forcedWilayahId = forcedPolres ? forcedPolres.wilayah_id : null;
    const rumahSakitPool = forcedWilayahId
        ? master.rumahSakit.filter((rs) => rs.wilayah_id === forcedWilayahId)
        : master.rumahSakit;


    // Polres: prioritas polres yang dipaksa dari pilihan sheet (1 sheet = 1 polres).
    // Jika tidak dipaksa, ambil dari kecamatan yang termatch.
    let polresId = forcedPolresId || null;
    if (!polresId && kecamatanMatch) polresId = kecamatanMatch.polres_id || null;
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
        lokasi_laka: laporan.lokasi_laka || "",
        // laka_tunggal = true jika kolom boolean di sheet TRUE,
        // ATAU jika ada korban yang tindak_lanjutnya "Laka Tunggal"
        // (menangani inkonsistensi sheet: kolom boolean sering dikosongkan/FALSE
        //  padahal tindak lanjut korban sudah ditulis "Laka Tunggal")
        laka_tunggal:
            laporan.laka_tunggal === "TRUE" ||
            laporan.laka_tunggal === "true" ||
            group.korban.some((k) =>
                (k.tindak_lanjut || "").toString().toLowerCase().trim() === "laka tunggal"
            ),
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

            let rumahSakitId = lookupId(rumahSakitPool, k.rs_sendiri);
            if (!rumahSakitId && forcedWilayahId && k.rs_sendiri) {
                rumahSakitId = lookupId(master.rumahSakit, k.rs_sendiri);
            }
            if (!rumahSakitId && k.rs_sendiri) {
                issues.push({ field: "rumah_sakit", value: k.rs_sendiri });
            }

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
                rumah_sakit_id: rumahSakitId,
                rumah_sakit_nama: nameById(master.rumahSakit, rumahSakitId),
                rumah_sakit_wilayah: k.rs_lain || null,
            };
        }),
    };

    // Label master untuk level laporan (memudahkan verifikasi manual di UI)
    payload.labels = {
        polres: nameById(master.polres, polresId),
        kecamatan: kecamatanMatch ? kecamatanMatch.nama : null,
        kelurahan: kelurahanMatch ? kelurahanMatch.nama : null,
        kelurahan_from_lokasi: kelurahanFromLokasi,
        rumah_sakit: payload.korban.map((kb) => kb.rumah_sakit_nama || kb.rumah_sakit_wilayah).filter(Boolean).join("; ") || null,
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
        // Potong string agar tidak melebihi batas kolom DB (data sheet sering
        // tidak konsisten / kepanjangan). Ambil karakter awal, sisanya dibuang.
        const cut = (v, max) => {
            if (v === null || v === undefined) return v;
            const s = String(v).trim();
            return s.length > max ? s.slice(0, max) : s;
        };

        const diffMs = new Date(payload.tanggal_lp) - new Date(payload.tanggal_laka);
        const telat_lp = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

        const laporanPolisi = await LaporanPolisi.create(
            {
                no_lp: cut(payload.no_lp, 100),
                polres_id: Number(payload.polres_id),
                tanggal_laka: payload.tanggal_laka,
                hari_kejadian: cut(payload.hari_kejadian, 20),
                tanggal_lp: payload.tanggal_lp,
                telat_lp,
                kecamatan_id: Number(payload.kecamatan_id),
                kelurahan_id: Number(payload.kelurahan_id),
                lokasi_laka: cut(payload.lokasi_laka, 255) || null,
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

        // Kendaraan — hanya simpan yang lengkap (punya jenis_kendaraan_id & nopol).
        // Kendaraan yang tidak lengkap (mis. penjamin kosong) dilewati.
        // Peta index: index ASLI di payload → id kendaraan yang tersimpan.
        const kendaraanIndexMap = {};
        const kendaraanArr = Array.isArray(payload.kendaraan) ? payload.kendaraan : [];
        for (let i = 0; i < kendaraanArr.length; i++) {
            const k = kendaraanArr[i];
            const nopol = cut(k.nopol, 20) || "";
            // Lewati kendaraan tidak lengkap agar tidak melanggar NOT NULL
            if (!k.jenis_kendaraan_id || !nopol) continue;
            const newKendaraan = await Kendaraan.create(
                {
                    laporan_polisi_id: laporanPolisi.id,
                    peran: k.peran,
                    jenis_kendaraan_id: Number(k.jenis_kendaraan_id),
                    nopol,
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
                    nama: cut(krb.nama, 150) || "",
                    usia: krb.usia ? Number(krb.usia) : null,
                    profesi_id: krb.profesi_id ? Number(krb.profesi_id) : null,
                    cidera_id: krb.cidera_id ? Number(krb.cidera_id) : null,
                    kendaraan_id: resolvedKendaraanId,
                    tindak_lanjut_id: krb.tindak_lanjut_id ? Number(krb.tindak_lanjut_id) : null,
                    jenis_jaminan_id: krb.jenis_jaminan_id ? Number(krb.jenis_jaminan_id) : null,
                    keterjaminan_id: krb.keterjaminan_id ? Number(krb.keterjaminan_id) : null,
                    rumah_sakit_id: krb.rumah_sakit_id ? Number(krb.rumah_sakit_id) : null,
                    rumah_sakit_wilayah: cut(krb.rumah_sakit_wilayah, 150) ?? null,
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

        // ════════════════════════════════════════════════════════════
        logger.section(`MIGRASI getSheetData — Sheet: "${sheetName}"  Baris: ${startRow}-${endRow}`);

        // ── Tahap 1: Baca data ───────────────────────────────────────
        logger.sub("Tahap 1: Baca sheet & master data");
        const [master, rows, topBlock] = await Promise.all([
            loadMasterData(),
            fetchSheetRows(sheetName, startRow, endRow),
            fetchTopBlock(sheetName, 1, 8).catch(() => []),
        ]);
        logger.table([
            ["Sheet",           sheetName],
            ["Rentang baris",   `${startRow} – ${endRow}`],
            ["Baris raw diambil", rows ? rows.length : 0],
            ["Master polres",   master.polres.length],
            ["Master kecamatan", master.kecamatan.length],
            ["Master kelurahan", master.kelurahan.length],
        ]);

        if (!rows || rows.length === 0) {
            logger.warn(`Sheet "${sheetName}" kosong pada rentang baris ${startRow}-${endRow}`);
            return successResponse(res, 200, "Tidak ada data pada sheet ini", {
                sheet: sheetName,
                rows: [],
            });
        }

        // ── Tahap 2: Parsing & grouping ──────────────────────────────
        logger.sub("Tahap 2: Deteksi kolom, parsing baris, grouping per No LP");
        const dynamicMapping = detectColumnMapping(topBlock);
        const mappingMode = dynamicMapping ? "DINAMIS (dari header sheet)" : "STATIS (posisi kolom default)";
        logger.progress("MIGRASI", `Mode mapping kolom : ${mappingMode}`);

        const parsed = parseRows(rows, startRow, dynamicMapping || undefined);
        const grouped = groupByLp(parsed);
        const totalGrouped = Object.keys(grouped).length;

        logger.table([
            ["Baris setelah parse", parsed.length],
            ["No LP unik (grouped)", totalGrouped],
        ]);

        // ── DIAGNOSTIK: distribusi laka_tunggal raw ──────────────────
        logger.sub("Diagnostik: laka_tunggal (nilai raw dari sheet)");
        logger.lakaTunggalSummary("MIGRASI", grouped);

        // ── Tahap 3: Deteksi polres sheet ───────────────────────────
        logger.separator();
        logger.sub("Tahap 3: Deteksi polres sheet");
        const { polresId: sheetPolresId, source: polresSource } =
            detectSheetPolres(topBlock, grouped, master);
        const sheetPolresNama = sheetPolresId
            ? (master.polres.find((p) => p.id === sheetPolresId)?.nama || null)
            : null;
        const sheetWilayahId = sheetPolresId
            ? (master.polres.find((p) => p.id === sheetPolresId)?.wilayah_id || null)
            : null;

        logger.table([
            ["Polres terdeteksi", sheetPolresNama || "TIDAK TERDETEKSI"],
            ["Polres ID",         sheetPolresId   || "-"],
            ["Wilayah ID",        sheetWilayahId  || "-"],
            ["Sumber deteksi",    polresSource],
        ]);
        if (!sheetPolresId) {
            logger.warn("Polres tidak terdeteksi — mapping polres per-LP akan dicoba via kecamatan");
        }

        // ── Tahap 4: Cek duplikat No LP di DB ───────────────────────
        logger.separator();
        logger.sub("Tahap 4: Cek duplikat No LP di DB");
        const noLpList = Object.keys(grouped);
        const existing = await LaporanPolisi.findAll({
            where: { no_lp: noLpList, is_active: true },
            attributes: ["no_lp", "polres_id"],
            raw: true,
        });
        const existingSet = new Set(existing.map((e) => `${e.no_lp}|${e.polres_id}`));
        logger.progress("MIGRASI", `Ditemukan ${existing.length} No LP yang sudah ada di DB (kombinasi no_lp+polres_id)`);

        // ── Tahap 5: Mapping payload + validasi ──────────────────────
        logger.separator();
        logger.sub("Tahap 5: Mapping payload & validasi master");

        const sortedKeys = noLpList.sort(
            (a, b) => (grouped[a].laporan._baris || 0) - (grouped[b].laporan._baris || 0)
        );

        let cValid = 0, cInvalid = 0, cDup = 0;
        // Kumpulkan semua issue per field untuk summary akhir
        const issueFieldCount = {};
        const missingFieldCount = {};

        const resultRows = sortedKeys.map((noLp) => {
            const group = grouped[noLp];
            const { payload, issues } = mapGroupToPayload(group, master, sheetPolresId);
            const missing = getMissingFields(payload);
            const duplicate =
                payload.polres_id != null &&
                existingSet.has(`${noLp}|${payload.polres_id}`);

            let status = "VALID";
            if (missing.length > 0 || issues.length > 0) status = "INVALID_MASTER";
            if (duplicate) status = "DUPLICATE";

            if (status === "VALID") cValid++;
            else if (status === "DUPLICATE") cDup++;
            else cInvalid++;

            // Kumpulkan statistik issue
            for (const iss of issues) {
                issueFieldCount[iss.field] = (issueFieldCount[iss.field] || 0) + 1;
            }
            for (const mf of missing) {
                missingFieldCount[mf] = (missingFieldCount[mf] || 0) + 1;
            }

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

        // ── DIAGNOSTIK: laka_tunggal setelah mapping ke boolean ──────
        logger.sub("Diagnostik: laka_tunggal (setelah konversi payload → boolean)");
        logger.lakaTunggalPayloadSummary("MIGRASI", resultRows.map((r) => r.payload));

        // ── Tahap 6: Summary akhir ───────────────────────────────────
        logger.separator();
        logger.sub("Tahap 6: Summary akhir");
        logger.table([
            ["Total No LP",  totalGrouped],
            ["VALID",        cValid],
            ["INVALID_MASTER", cInvalid],
            ["DUPLICATE",    cDup],
        ]);

        if (Object.keys(missingFieldCount).length > 0) {
            logger.progress("MIGRASI", "Field wajib yang kosong (jumlah LP terpengaruh):");
            for (const [field, count] of Object.entries(missingFieldCount).sort((a, b) => b[1] - a[1])) {
                logger.progress("MIGRASI", `  ${String(count).padStart(4)}x  missing: ${field}`);
            }
        }

        if (Object.keys(issueFieldCount).length > 0) {
            logger.progress("MIGRASI", "Field dengan mapping tidak cocok ke master (jumlah LP terpengaruh):");
            for (const [field, count] of Object.entries(issueFieldCount).sort((a, b) => b[1] - a[1])) {
                logger.progress("MIGRASI", `  ${String(count).padStart(4)}x  issue : ${field}`);
            }
        }

        logger.progress("MIGRASI", "getSheetData selesai. Data dikirim ke UI.");

        return successResponse(res, 200, "Data sheet berhasil diambil", {
            sheet: sheetName,
            start_row: startRow,
            end_row: endRow,
            detected_polres: sheetPolresNama,
            detected_polres_id: sheetPolresId,
            detected_wilayah_id: sheetWilayahId,
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
        const { payload } = req.body;

        if (!payload || !payload.no_lp) {
            return errorResponse(res, 400, "payload dengan no_lp wajib dikirim");
        }

        // ── Log detail payload yang akan diimpor ─────────────────────
        logger.section(`MIGRASI importRow — No LP: "${payload.no_lp}"`);
        logger.sub("Payload yang diterima");
        logger.table([
            ["no_lp",          payload.no_lp],
            ["polres_id",      payload.polres_id],
            ["tanggal_laka",   payload.tanggal_laka],
            ["tanggal_lp",     payload.tanggal_lp],
            ["kecamatan_id",   payload.kecamatan_id],
            ["kelurahan_id",   payload.kelurahan_id],
            ["laka_tunggal",   String(payload.laka_tunggal) + " (" + typeof payload.laka_tunggal + ")"],
            ["rumah_sakit",    payload.korban ? payload.korban.map(k => k.rumah_sakit_nama || k.rumah_sakit_wilayah).filter(Boolean).join("; ") : "-"],
            ["jumlah korban",  Array.isArray(payload.korban) ? payload.korban.length : 0],
            ["jumlah kendaraan", Array.isArray(payload.kendaraan) ? payload.kendaraan.length : 0],
        ]);

        // Validasi field wajib
        const missing = getMissingFields(payload);
        if (missing.length > 0) {
            logger.warn(`Import DITOLAK — field wajib kosong: ${missing.join(", ")}`);
            return errorResponse(
                res,
                400,
                `Data tidak lengkap. Field wajib kosong: ${missing.join(", ")}`
            );
        }

        // Cek duplikat berbasis (no_lp + polres_id)
        const existing = await LaporanPolisi.findOne({
            where: {
                no_lp: String(payload.no_lp).trim(),
                polres_id: Number(payload.polres_id),
                is_active: true,
            },
            attributes: ["id"],
        });
        if (existing) {
            logger.warn(`Import DITOLAK — duplikat: No LP "${payload.no_lp}" sudah ada (ID #${existing.id}) di polres ${payload.polres_id}`);
            return errorResponse(
                res,
                409,
                `No LP "${payload.no_lp}" sudah ada di polres ini (ID #${existing.id})`
            );
        }

        logger.progress("MIGRASI", `Menyimpan ke DB — laka_tunggal=${payload.laka_tunggal} ...`);
        const laporan = await insertLaporanPayload(payload, req);

        logger.separator();
        logger.sub("Import berhasil");
        logger.table([
            ["ID laporan baru", laporan.id],
            ["No LP",          payload.no_lp],
            ["Polres ID",       payload.polres_id],
            ["laka_tunggal",   String(payload.laka_tunggal)],
            ["Korban disimpan", Array.isArray(payload.korban) ? payload.korban.length : 0],
        ]);

        const result = await LaporanPolisi.findByPk(laporan.id);
        return successResponse(res, 201, "Baris berhasil diimpor ke database", result);
    } catch (error) {
        logger.error("Import row error", error);
        const detail =
            error?.errors?.[0]?.message ||
            error?.parent?.sqlMessage ||
            error?.message ||
            null;
        return errorResponse(res, 500, "Gagal mengimpor baris ke database", detail);
    }
};

module.exports = {
    getSheetData,
    checkRow,
    importRow,
};
