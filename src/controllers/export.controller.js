// src/controllers/export.controller.js
// Export data ke Excel (XLSX) menggunakan ExcelJS.
// READ-ONLY terhadap data: hanya membaca DB lalu menghasilkan file.
// Tidak mengubah logika/endpoint lain.

const ExcelJS = require("exceljs");
const { Op } = require("sequelize");

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
} = require("../models");

const {
    _createEmptyRekapRow,
    _aggregateRekapRow,
} = require("./laporanPolisi.controller");

const logger = require("../utils/logger");

// ── Konstanta gaya (warna korporat Jasa Raharja) ──────────────
const BRAND = "FF154E7D"; // biru tua
const BRAND_LIGHT = "FFDCE9F5";
const HEADER_TEXT = "FFFFFFFF";
const BORDER_COLOR = "FFB0BEC5";

const thinBorder = {
    top: { style: "thin", color: { argb: BORDER_COLOR } },
    left: { style: "thin", color: { argb: BORDER_COLOR } },
    bottom: { style: "thin", color: { argb: BORDER_COLOR } },
    right: { style: "thin", color: { argb: BORDER_COLOR } },
};

// ── Helper waktu WIB ──────────────────────────────────────────
function nowWIB() {
    const parts = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: false,
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value || "";
    return `${get("day")} ${get("month")} ${get("year")} ${get("hour")}:${get("minute")} WIB`;
}

function fmtTanggal(s) {
    if (!s) return "-";
    const d = new Date(s);
    if (isNaN(d.getTime())) return String(s);
    return new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta", day: "2-digit", month: "2-digit", year: "numeric",
    }).format(d);
}

// ── Header resmi + info generate (dipakai semua sheet) ────────
// Mengembalikan nomor baris terakhir header (data mulai setelahnya).
function buildOfficialHeader(ws, opts) {
    const {
        judul,
        subjudul,
        totalKolom,
        req,
        periodeText,
        polresText,
    } = opts;

    const lastCol = totalKolom >= 1 ? totalKolom : 1;
    const colLetter = ws.getColumn(lastCol).letter;

    // Baris 1: Instansi
    ws.mergeCells(`A1:${colLetter}1`);
    const c1 = ws.getCell("A1");
    c1.value = "PT JASA RAHARJA (PERSERO)";
    c1.font = { name: "Calibri", size: 14, bold: true, color: { argb: BRAND } };
    c1.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 20;

    // Baris 2: Judul laporan
    ws.mergeCells(`A2:${colLetter}2`);
    const c2 = ws.getCell("A2");
    c2.value = judul;
    c2.font = { name: "Calibri", size: 12, bold: true, color: { argb: "FF1E293B" } };
    c2.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(2).height = 18;

    // Baris 3: Subjudul (SILAKA)
    ws.mergeCells(`A3:${colLetter}3`);
    const c3 = ws.getCell("A3");
    c3.value = subjudul || "SILAKA — Sistem Informasi Pencatatan Laporan Kecelakaan";
    c3.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF64748B" } };
    c3.alignment = { horizontal: "center", vertical: "middle" };

    // Baris 4: kosong pemisah
    let row = 4;

    // Baris info: periode, polres, dicetak oleh, waktu
    const infoLines = [];
    if (periodeText) infoLines.push(["Periode", periodeText]);
    if (polresText) infoLines.push(["Polres/Wilayah", polresText]);
    const pencetak = req.user
        ? `${req.user.nama_lengkap || req.user.username} (${req.user.role})`
        : "Sistem";
    infoLines.push(["Dicetak oleh", pencetak]);
    infoLines.push(["Waktu cetak", nowWIB()]);

    infoLines.forEach((line) => {
        row++;
        const labelCell = ws.getCell(`A${row}`);
        labelCell.value = line[0];
        labelCell.font = { name: "Calibri", size: 9, bold: true, color: { argb: "FF475569" } };
        const valCell = ws.getCell(`B${row}`);
        // gabungkan sisa kolom untuk nilai
        if (lastCol > 2) ws.mergeCells(`B${row}:${colLetter}${row}`);
        valCell.value = `: ${line[1]}`;
        valCell.font = { name: "Calibri", size: 9, color: { argb: "FF1E293B" } };
    });

    row++; // baris kosong sebelum tabel
    return row;
}

// Terapkan style header tabel pada satu baris
function styleTableHeader(ws, rowNumber, totalKolom) {
    const r = ws.getRow(rowNumber);
    r.height = 22;
    for (let c = 1; c <= totalKolom; c++) {
        const cell = r.getCell(c);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
        cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: HEADER_TEXT } };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = thinBorder;
    }
}

function finalizeWorkbookResponse(res, workbook, filename) {
    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return workbook.xlsx.write(res).then(() => res.end());
}

// Bangun teks periode dari query
function periodeFromQuery(from, to) {
    if (from && to) return `${fmtTanggal(from)} s.d. ${fmtTanggal(to)}`;
    if (from) return `Sejak ${fmtTanggal(from)}`;
    if (to) return `Sampai ${fmtTanggal(to)}`;
    return "Semua periode";
}

// Resolusi nama polres untuk header
async function resolvePolresText(polres_id, req) {
    if (req.user?.role === "user") {
        const w = await Wilayah.findByPk(req.user.wilayah_id, { attributes: ["nama"] });
        return w ? `Wilayah ${w.nama}` : "Wilayah Anda";
    }
    if (polres_id && polres_id !== "ALL") {
        const p = await Polres.findByPk(Number(polres_id), { attributes: ["nama"] });
        return p ? p.nama : `Polres #${polres_id}`;
    }
    return "Semua Polres";
}

// ═══════════════════════════════════════════════════════════════
// 1) EXPORT LAPORAN POLISI (daftar rinci)
// GET /api/export/laporan-polisi?from&to&polres_id
// ═══════════════════════════════════════════════════════════════
const exportLaporanPolisi = async (req, res) => {
    try {
        const { from, to, polres_id } = req.query;

        const where = { is_active: true };
        if (from) where.tanggal_lp = { ...where.tanggal_lp, [Op.gte]: from };
        if (to) where.tanggal_lp = { ...where.tanggal_lp, [Op.lte]: to };
        if (polres_id && polres_id !== "ALL") where.polres_id = Number(polres_id);

        // Scope wilayah untuk user via kecamatan->polres
        const includeKecamatan = {
            model: Kecamatan, as: "kecamatan", attributes: ["id", "nama"],
        };
        if (req.user?.role === "user") {
            includeKecamatan.required = true;
            includeKecamatan.include = [{
                model: Polres, as: "polres", attributes: [],
                where: { wilayah_id: req.user.wilayah_id }, required: true,
            }];
        }

        const laporan = await LaporanPolisi.findAll({
            where,
            include: [
                { model: Polres, as: "polres", attributes: ["id", "nama"] },
                includeKecamatan,
                { model: Kelurahan, as: "kelurahan", attributes: ["id", "nama"] },
                { model: SifatLaka, as: "sifatLaka", attributes: ["id", "nama"] },
                { model: KasusTabrakKecelakaan, as: "kasusTabrakKecelakaan", attributes: ["id", "nama"] },
                { model: FaktorPenyebabLaka, as: "faktorPenyebabLaka", attributes: ["id", "nama"] },
                {
                    model: Kendaraan, as: "kendaraan", where: { is_active: true }, required: false,
                    attributes: ["id", "peran", "nopol", "jenis_kendaraan_id"],
                    include: [{ model: JenisKendaraan, as: "jenisKendaraan", attributes: ["nama"] }],
                },
                {
                    model: Korban, as: "korban", where: { is_active: true }, required: false,
                    attributes: ["id", "nama", "usia", "profesi_id", "cidera_id", "keterjaminan_id", "rumah_sakit_id", "rumah_sakit_wilayah"],
                    include: [
                        { model: Profesi, as: "profesi", attributes: ["nama"] },
                        { model: Cidera, as: "cidera", attributes: ["nama"] },
                        { model: Keterjaminan, as: "keterjaminan", attributes: ["nama"] },
                        { model: RumahSakit, as: "rumahSakit", attributes: ["nama"] },
                    ],
                },
            ],
            order: [["tanggal_lp", "ASC"], ["id", "ASC"]],
        });

        logger.progress("EXPORT", `Laporan Polisi: ${laporan.length} LP diekspor`);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = "SILAKA — Jasa Raharja";
        workbook.created = new Date();
        const ws = workbook.addWorksheet("Laporan Polisi", {
            views: [{ state: "frozen", ySplit: 0 }],
        });

        const headers = [
            "No", "No LP", "Polres", "Tanggal Laka", "Tanggal LP", "Hari",
            "Telat (hari)", "Kecamatan", "Kelurahan", "Lokasi Laka",
            "Rumah Sakit", "Laka Tunggal", "Kasus Tabrakan", "Faktor Penyebab",
            "Sifat Laka", "Jumlah Korban", "Jumlah Kendaraan", "Nama Korban", "Keterangan",
        ];
        const totalKolom = headers.length;

        const headerEndRow = buildOfficialHeader(ws, {
            judul: "LAPORAN DATA KECELAKAAN LALU LINTAS",
            totalKolom,
            req,
            periodeText: periodeFromQuery(from, to),
            polresText: await resolvePolresText(polres_id, req),
        });

        // Baris header tabel
        const headerRowNum = headerEndRow;
        ws.getRow(headerRowNum).values = headers;
        styleTableHeader(ws, headerRowNum, totalKolom);

        // Data
        laporan.forEach((l, idx) => {
            const namaKorban = (l.korban || []).map((k) => k.nama).filter(Boolean).join("; ");
            const namaRs = (l.korban || []).map((k) => k.rumahSakit?.nama || k.rumah_sakit_wilayah).filter(Boolean).join("; ");
            const r = ws.addRow([
                idx + 1,
                l.no_lp || "-",
                l.polres?.nama || "-",
                fmtTanggal(l.tanggal_laka),
                fmtTanggal(l.tanggal_lp),
                l.hari_kejadian || "-",
                l.telat_lp ?? 0,
                l.kecamatan?.nama || "-",
                l.kelurahan?.nama || "-",
                l.lokasi_laka || "-",
                namaRs || "-",
                l.laka_tunggal ? "Ya" : "Tidak",
                l.kasusTabrakKecelakaan?.nama || "-",
                l.faktorPenyebabLaka?.nama || "-",
                l.sifatLaka?.nama || "-",
                (l.korban || []).length,
                (l.kendaraan || []).length,
                namaKorban || "-",
                l.keterangan || "-",
            ]);
            r.eachCell((cell, colNumber) => {
                cell.border = thinBorder;
                cell.font = { name: "Calibri", size: 9 };
                cell.alignment = {
                    vertical: "middle",
                    horizontal: [1, 7, 12, 16, 17].includes(colNumber) ? "center" : "left",
                    wrapText: [10, 18].includes(colNumber),
                };
                if (idx % 2 === 1) {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F8FB" } };
                }
            });
        });

        // Lebar kolom
        const widths = [5, 14, 20, 13, 13, 9, 9, 16, 18, 34, 24, 10, 18, 16, 12, 9, 9, 30, 24];
        widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

        // Footer info total
        const totalRow = ws.addRow([]);
        ws.mergeCells(`A${totalRow.number}:${ws.getColumn(totalKolom).letter}${totalRow.number}`);
        const tcell = ws.getCell(`A${totalRow.number}`);
        tcell.value = `Total: ${laporan.length} laporan polisi`;
        tcell.font = { name: "Calibri", size: 9, bold: true, color: { argb: BRAND } };
        tcell.alignment = { horizontal: "right" };

        const filename = `Laporan_Polisi_${Date.now()}.xlsx`;
        return finalizeWorkbookResponse(res, workbook, filename);
    } catch (error) {
        logger.error("Export laporan polisi error", error);
        return res.status(500).json({ success: false, message: "Gagal mengekspor laporan polisi" });
    }
};

// ═══════════════════════════════════════════════════════════════
// 2) EXPORT MONITORING DATA (spreadsheet per korban, seperti tampilan monitor)
// GET /api/export/monitoring?from&to&polres_id
// ═══════════════════════════════════════════════════════════════
const exportMonitoring = async (req, res) => {
    try {
        const { from, to, polres_id } = req.query;

        const where = { is_active: true };
        if (from) where.tanggal_lp = { ...where.tanggal_lp, [Op.gte]: from };
        if (to) where.tanggal_lp = { ...where.tanggal_lp, [Op.lte]: to };
        if (polres_id && polres_id !== "ALL") where.polres_id = Number(polres_id);

        const includeKecamatan = { model: Kecamatan, as: "kecamatan", attributes: ["id", "nama"] };
        if (req.user?.role === "user") {
            includeKecamatan.required = true;
            includeKecamatan.include = [{
                model: Polres, as: "polres", attributes: [],
                where: { wilayah_id: req.user.wilayah_id }, required: true,
            }];
        }

        const laporan = await LaporanPolisi.findAll({
            where,
            include: [
                { model: Polres, as: "polres", attributes: ["id", "nama"] },
                includeKecamatan,
                { model: Kelurahan, as: "kelurahan", attributes: ["id", "nama"] },
                { model: SifatLaka, as: "sifatLaka", attributes: ["nama"] },
                { model: KasusTabrakKecelakaan, as: "kasusTabrakKecelakaan", attributes: ["nama"] },
                { model: FaktorPenyebabLaka, as: "faktorPenyebabLaka", attributes: ["nama"] },
                {
                    model: Kendaraan, as: "kendaraan", where: { is_active: true }, required: false,
                    attributes: ["id", "peran", "nopol", "masa_laku_sw", "jenis_kendaraan_id"],
                    include: [{ model: JenisKendaraan, as: "jenisKendaraan", attributes: ["nama"] }],
                },
                {
                    model: Korban, as: "korban", where: { is_active: true }, required: false,
                    attributes: ["id", "nama", "usia", "profesi_id", "cidera_id", "kendaraan_id", "tindak_lanjut_id", "jenis_jaminan_id", "keterjaminan_id"],
                    include: [
                        { model: Profesi, as: "profesi", attributes: ["nama"] },
                        { model: Cidera, as: "cidera", attributes: ["nama"] },
                        { model: TindakLanjut, as: "tindakLanjut", attributes: ["nama"] },
                        { model: JenisJaminan, as: "jenisJaminan", attributes: ["nama"] },
                        { model: Keterjaminan, as: "keterjaminan", attributes: ["nama"] },
                    ],
                },
            ],
            order: [["no_lp", "ASC"], ["id", "ASC"]],
        });

        logger.progress("EXPORT", `Monitoring: ${laporan.length} LP diekspor`);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = "SILAKA — Jasa Raharja";
        workbook.created = new Date();
        const ws = workbook.addWorksheet("Monitoring Data");

        const headers = [
            "No", "No LP", "Nama Korban", "Usia", "Profesi", "Tanggal Laka", "Tanggal LP",
            "LP Terlambat", "Kecamatan", "Kelurahan", "Lokasi Laka", "Laka Tunggal",
            "Tindak Lanjut", "Cidera", "Kend. Korban", "Nopol Korban",
            "Kend. Penjamin", "Nopol Penjamin", "Jenis Jaminan", "Keterjaminan",
            "Kasus Tabrakan", "Faktor Penyebab", "Sifat Laka", "Keterangan",
        ];
        const totalKolom = headers.length;

        const headerEndRow = buildOfficialHeader(ws, {
            judul: "MONITORING DATA KECELAKAAN LALU LINTAS",
            totalKolom,
            req,
            periodeText: periodeFromQuery(from, to),
            polresText: await resolvePolresText(polres_id, req),
        });

        const headerRowNum = headerEndRow;
        ws.getRow(headerRowNum).values = headers;
        styleTableHeader(ws, headerRowNum, totalKolom);

        let no = 0;
        let rowIdx = 0;
        laporan.forEach((l) => {
            const kendKorban = (l.kendaraan || []).filter((k) => k.peran === "korban");
            const kendPenjamin = (l.kendaraan || []).filter((k) => k.peran === "penjamin");
            const kk = kendKorban[0];
            const kp = kendPenjamin[0];
            const korbanList = (l.korban || []);

            const emitRow = (korban) => {
                no++;
                const r = ws.addRow([
                    no,
                    l.no_lp || "-",
                    korban?.nama || "-",
                    korban?.usia ?? "-",
                    korban?.profesi?.nama || "-",
                    fmtTanggal(l.tanggal_laka),
                    fmtTanggal(l.tanggal_lp),
                    (l.telat_lp ?? 0) > 0 ? "TERLAMBAT" : "NORMAL",
                    l.kecamatan?.nama || "-",
                    l.kelurahan?.nama || "-",
                    l.lokasi_laka || "-",
                    l.laka_tunggal ? "Ya" : "Tidak",
                    korban?.tindakLanjut?.nama || "-",
                    korban?.cidera?.nama || "-",
                    kk?.jenisKendaraan?.nama || "-",
                    kk?.nopol || "-",
                    kp?.jenisKendaraan?.nama || "-",
                    kp?.nopol || "-",
                    korban?.jenisJaminan?.nama || "-",
                    korban?.keterjaminan?.nama || "-",
                    l.kasusTabrakKecelakaan?.nama || "-",
                    l.faktorPenyebabLaka?.nama || "-",
                    l.sifatLaka?.nama || "-",
                    l.keterangan || "-",
                ]);
                r.eachCell((cell, colNumber) => {
                    cell.border = thinBorder;
                    cell.font = { name: "Calibri", size: 9 };
                    cell.alignment = {
                        vertical: "middle",
                        horizontal: [1, 4, 8, 12].includes(colNumber) ? "center" : "left",
                        wrapText: [11, 24].includes(colNumber),
                    };
                    if (rowIdx % 2 === 1) {
                        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F8FB" } };
                    }
                });
                rowIdx++;
            };

            if (korbanList.length === 0) emitRow(null);
            else korbanList.forEach((k) => emitRow(k));
        });

        const widths = [5, 14, 26, 6, 18, 13, 13, 12, 16, 18, 30, 10, 16, 10, 12, 14, 12, 14, 16, 14, 18, 16, 12, 22];
        widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

        const filename = `Monitoring_Data_${Date.now()}.xlsx`;
        return finalizeWorkbookResponse(res, workbook, filename);
    } catch (error) {
        logger.error("Export monitoring error", error);
        return res.status(500).json({ success: false, message: "Gagal mengekspor monitoring data" });
    }
};

// ═══════════════════════════════════════════════════════════════
// 3) EXPORT REKAPITULASI (per Polres & per Loket/Wilayah, 2 sheet)
// GET /api/export/rekapitulasi?from&to&polres_id
// ═══════════════════════════════════════════════════════════════

// Kolom rekap (label + key) — urutan kolom Excel
const REKAP_COLUMNS = [
    { key: "nama", label: "Nama", width: 26, align: "left" },
    { key: "wilayah", label: "Wilayah", width: 22, align: "left" },
    { key: "jumlah_lp", label: "Jumlah LP", width: 10 },
    { key: "terlambat_lapor", label: "Terlambat Lapor", width: 12 },
    { key: "jumlah_korban", label: "Jumlah Korban", width: 12 },
    { key: "laka_tunggal", label: "Laka Tunggal", width: 11 },
    { key: "ll", label: "LL", width: 7 },
    { key: "ll_md", label: "LL-MD", width: 8 },
    { key: "md", label: "MD", width: 7 },
    { key: "terjamin", label: "Terjamin", width: 10 },
    { key: "eg2r", label: "EG2R", width: 8 },
    { key: "tidak_terjamin", label: "Tidak Terjamin", width: 12 },
    { key: "telat_1_3", label: "Telat 1-3 hari", width: 11 },
    { key: "telat_4_7", label: "Telat 4-7 hari", width: 11 },
    { key: "telat_lebih_7", label: "Telat >7 hari", width: 11 },
];

function writeRekapSheet(ws, rows, totals, opts) {
    const totalKolom = REKAP_COLUMNS.length;
    const headerEndRow = buildOfficialHeader(ws, {
        judul: opts.judul,
        totalKolom,
        req: opts.req,
        periodeText: opts.periodeText,
        polresText: opts.polresText,
    });

    const headerRowNum = headerEndRow;
    ws.getRow(headerRowNum).values = REKAP_COLUMNS.map((c) => c.label);
    styleTableHeader(ws, headerRowNum, totalKolom);

    rows.forEach((row, idx) => {
        const r = ws.addRow(REKAP_COLUMNS.map((c) => row[c.key] ?? (typeof row[c.key] === "number" ? 0 : "-")));
        r.eachCell((cell, colNumber) => {
            cell.border = thinBorder;
            cell.font = { name: "Calibri", size: 9 };
            const col = REKAP_COLUMNS[colNumber - 1];
            cell.alignment = { vertical: "middle", horizontal: col.align === "left" ? "left" : "center" };
            if (idx % 2 === 1) {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F8FB" } };
            }
        });
    });

    // Baris TOTAL
    const totalArr = REKAP_COLUMNS.map((c, i) => {
        if (i === 0) return "TOTAL";
        if (c.align === "left") return "";
        return totals[c.key] ?? 0;
    });
    const tr = ws.addRow(totalArr);
    tr.eachCell((cell, colNumber) => {
        cell.border = thinBorder;
        cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: HEADER_TEXT } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
        const col = REKAP_COLUMNS[colNumber - 1];
        cell.alignment = { vertical: "middle", horizontal: col.align === "left" ? "left" : "center" };
    });

    REKAP_COLUMNS.forEach((c, i) => { ws.getColumn(i + 1).width = c.width; });
}

const exportRekapitulasi = async (req, res) => {
    try {
        const { from, to, polres_id } = req.query;
        const baseWhere = { is_active: true };
        if (from) baseWhere.tanggal_lp = { ...baseWhere.tanggal_lp, [Op.gte]: from };
        if (to) baseWhere.tanggal_lp = { ...baseWhere.tanggal_lp, [Op.lte]: to };
        if (polres_id && polres_id !== "ALL") baseWhere.polres_id = Number(polres_id);

        // Scope
        let polresScope = { is_active: true };
        if (req.user?.role === "user") polresScope.wilayah_id = req.user.wilayah_id;
        let wilayahScope = { is_active: true };
        if (req.user?.role === "user") wilayahScope.id = req.user.wilayah_id;

        const [allPolres, allWilayah, laporan] = await Promise.all([
            Polres.findAll({
                where: polresScope,
                include: [{ model: Wilayah, as: "wilayah", attributes: ["id", "nama"] }],
                order: [["nama", "ASC"]],
            }),
            Wilayah.findAll({ where: wilayahScope, order: [["nama", "ASC"]] }),
            LaporanPolisi.findAll({
                where: baseWhere,
                include: [
                    {
                        model: Korban, as: "korban", where: { is_active: true }, required: false,
                        include: [
                            { model: Cidera, as: "cidera", attributes: ["id", "nama"], required: false },
                            { model: Keterjaminan, as: "keterjaminan", attributes: ["id", "nama"], required: false },
                            { model: Profesi, as: "profesi", attributes: ["id", "nama"], required: false },
                        ],
                    },
                    {
                        model: Kendaraan, as: "kendaraan", where: { is_active: true }, required: false,
                        include: [{ model: JenisKendaraan, as: "jenisKendaraan", attributes: ["id", "nama"], required: false }],
                    },
                    { model: KasusTabrakKecelakaan, as: "kasusTabrakKecelakaan", attributes: ["id", "nama"], required: false },
                    {
                        model: Polres, as: "polres", attributes: ["id", "nama", "wilayah_id"], required: false,
                        include: [{ model: Wilayah, as: "wilayah", attributes: ["id", "nama"], required: false }],
                    },
                ],
            }),
        ]);

        // Agregasi per Polres
        const polresMap = {};
        allPolres.forEach((p) => {
            polresMap[p.id] = _createEmptyRekapRow(p.id, p.nama, p.wilayah ? p.wilayah.nama : "");
        });
        laporan.forEach((l) => {
            const pid = l.polres_id;
            if (!polresMap[pid]) {
                polresMap[pid] = _createEmptyRekapRow(pid, l.polres ? l.polres.nama : "Polres #" + pid, l.polres && l.polres.wilayah ? l.polres.wilayah.nama : "");
            }
            _aggregateRekapRow(polresMap[pid], l);
        });
        const polresRows = Object.values(polresMap).sort((a, b) => a.nama.localeCompare(b.nama));
        const polresTotals = polresRows.reduce((acc, row) => {
            Object.keys(row).forEach((k) => { if (typeof row[k] === "number") acc[k] = (acc[k] || 0) + row[k]; });
            return acc;
        }, {});

        // Agregasi per Loket/Wilayah
        const wilayahMap = {};
        allWilayah.forEach((w) => { wilayahMap[w.id] = _createEmptyRekapRow(w.id, w.nama, ""); });
        laporan.forEach((l) => {
            const wid = l.polres ? l.polres.wilayah_id : null;
            if (!wid) return;
            if (!wilayahMap[wid]) {
                wilayahMap[wid] = _createEmptyRekapRow(wid, l.polres && l.polres.wilayah ? l.polres.wilayah.nama : "Loket #" + wid, "");
            }
            _aggregateRekapRow(wilayahMap[wid], l);
        });
        const loketRows = Object.values(wilayahMap).sort((a, b) => a.nama.localeCompare(b.nama));
        const loketTotals = loketRows.reduce((acc, row) => {
            Object.keys(row).forEach((k) => { if (typeof row[k] === "number") acc[k] = (acc[k] || 0) + row[k]; });
            return acc;
        }, {});

        logger.progress("EXPORT", `Rekapitulasi: ${polresRows.length} polres, ${loketRows.length} loket`);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = "SILAKA — Jasa Raharja";
        workbook.created = new Date();

        const periodeText = periodeFromQuery(from, to);
        const polresText = await resolvePolresText(polres_id, req);

        const wsPolres = workbook.addWorksheet("Rekap per Polres");
        writeRekapSheet(wsPolres, polresRows, polresTotals, {
            judul: "REKAPITULASI DATA KECELAKAAN PER POLRES",
            req, periodeText, polresText,
        });

        const wsLoket = workbook.addWorksheet("Rekap per Loket");
        writeRekapSheet(wsLoket, loketRows, loketTotals, {
            judul: "REKAPITULASI DATA KECELAKAAN PER LOKET WILAYAH",
            req, periodeText, polresText,
        });

        const filename = `Rekapitulasi_${Date.now()}.xlsx`;
        return finalizeWorkbookResponse(res, workbook, filename);
    } catch (error) {
        logger.error("Export rekapitulasi error", error);
        return res.status(500).json({ success: false, message: "Gagal mengekspor rekapitulasi" });
    }
};

module.exports = {
    exportLaporanPolisi,
    exportMonitoring,
    exportRekapitulasi,
};
