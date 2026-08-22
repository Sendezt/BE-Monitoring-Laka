// src/utils/googleSheets.js
// Helper untuk membaca Google Spreadsheet + logika transform/mapping data
// (diadaptasi dari script fetchLaka3.js ke arsitektur backend).

const sheets = require("../config/google");

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// ============================================
// MAPPING KOLOM (sesuai fetchLaka3.js)
// ============================================
const COLUMN_MAPPING = {
    0: "bulan",
    1: "nomor_urut",
    2: "no_lp",
    3: "nama_korban",
    4: "usia",
    5: "profesi",
    6: "tanggal_laka",
    7: "tanggal_lp",
    8: "lp_terlambat",
    9: "kecamatan",
    10: "kelurahan",
    11: "lokasi_laka",
    12: "rs_sendiri",
    13: "rs_lain",
    14: "laka_tunggal",
    15: "tindak_lanjut",
    16: "cidera",
    17: "jenis_kendaraan_korban",
    18: "nopol_korban",
    19: "masa_laku_sw_korban",
    20: "jenis_kendaraan_penjamin",
    21: "nopol_penjamin",
    22: "masa_laku_sw_penjamin",
    23: "jenis_jaminan",
    24: "keterjaminan",
    25: "kasus_tabrakan", // Z
    26: "faktor_penyebab", // AA
    27: "sifat_laka", // AB
    28: "keterangan",
    29: "hari_kejadian",
    55: "hari", // BD
};

const HARI_MAPPING = {
    senin: "Senin", selasa: "Selasa", rabu: "Rabu", kamis: "Kamis",
    jumat: "Jumat", sabtu: "Sabtu", minggu: "Minggu",
    sen: "Senin", sel: "Selasa", rab: "Rabu", kam: "Kamis",
    jum: "Jumat", sab: "Sabtu", min: "Minggu",
    1: "Senin", 2: "Selasa", 3: "Rabu", 4: "Kamis",
    5: "Jumat", 6: "Sabtu", 7: "Minggu",
};

// Peta kode → nama jenis kendaraan (fallback saat mapping)
const KENDARAAN_KEYWORD_MAP = {
    C1: "Sepeda Motor",
    C2: "Mobil Penumpang",
    C3: "Truk",
    C4: "Bus",
    DP: "Delman/Pedati",
    F: "Sepeda",
    B: "Becak",
    O: "Lainnya",
};

// ============================================
// FORMAT TANGGAL → YYYY-MM-DD (DATEONLY)
// ============================================
function formatDate(dateStr) {
    if (!dateStr) return null;

    const str = dateStr.toString().trim();

    // dd-mm-yyyy atau dd/mm/yyyy
    let match = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (match) {
        const day = match[1].padStart(2, "0");
        const month = match[2].padStart(2, "0");
        let year = match[3];
        if (year.length === 2) year = "20" + year;
        return `${year}-${month}-${day}`;
    }

    const monthMap = {
        jan: "01", feb: "02", mar: "03", apr: "04",
        may: "05", jun: "06", jul: "07", aug: "08",
        sep: "09", oct: "10", nov: "11", dec: "12",
    };

    // dd-MMM-yyyy
    match = str.match(/^(\d{1,2})[-/](\w{3})[-/](\d{2,4})$/i);
    if (match) {
        const day = match[1].padStart(2, "0");
        const monthName = match[2].toLowerCase().substring(0, 3);
        const month = monthMap[monthName];
        let year = match[3];
        if (year.length === 2) year = "20" + year;
        if (month) return `${year}-${month}-${day}`;
    }

    // yyyy-mm-dd
    match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) return str;

    const date = new Date(str);
    if (!isNaN(date.getTime())) {
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const y = date.getFullYear();
        return `${y}-${m}-${d}`;
    }

    return null;
}

function formatMasaLakuSW(dateStr) {
    if (!dateStr) return null;
    const str = dateStr.toString().trim();
    const invalidValues = ["", "Invalid date", "#VALUE!", "NULL", "null", "-", "N/A", "NA", "Tidak Ditemukan"];
    if (invalidValues.includes(str)) return null;
    return formatDate(str);
}

// ============================================
// FUZZY MATCHING
// ============================================
function stringSimilarity(str1, str2) {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;

    let matches = 0;
    const len = Math.min(s1.length, s2.length);
    for (let i = 0; i < len; i++) {
        if (s1[i] === s2[i]) matches++;
    }
    return matches / Math.max(s1.length, s2.length);
}

function findBestMatch(data, value, field = "nama", threshold = 0.7) {
    if (!value || !data || data.length === 0) return null;

    const normalizedValue = value.toString().trim();
    let bestMatch = null;
    let bestScore = 0;

    for (const item of data) {
        const itemValue = item[field] ? item[field].toString().trim() : "";
        if (!itemValue) continue;

        const score = stringSimilarity(normalizedValue, itemValue);
        if (score > bestScore && score >= threshold) {
            bestScore = score;
            bestMatch = item;
        }
    }

    return bestMatch;
}

function lookupExact(data, value, field = "nama") {
    if (!value || !data || data.length === 0) return null;
    const normalizedValue = value.toString().trim().toLowerCase();
    const found = data.find((item) => {
        const itemValue = item[field] ? item[field].toString().trim().toLowerCase() : "";
        return itemValue === normalizedValue;
    });
    return found || null;
}

// Kembalikan item master (bukan hanya id) agar controller bisa tahu nama termatch
function lookup(data, value, field = "nama", threshold = 0.7) {
    if (!value || !data || data.length === 0) return null;
    const exact = lookupExact(data, value, field);
    if (exact) return exact;
    return findBestMatch(data, value, field, threshold);
}

function lookupId(data, value, field = "nama", threshold = 0.7) {
    const match = lookup(data, value, field, threshold);
    return match ? match.id : null;
}

function lookupPolresIdByKecamatan(kecamatanData, kecamatanNama) {
    if (!kecamatanNama || !kecamatanData || kecamatanData.length === 0) return null;
    const match = findBestMatch(kecamatanData, kecamatanNama);
    return match ? match.polres_id : null;
}

// ============================================
// FETCH GOOGLE SHEETS
// ============================================
async function fetchSheetRows(sheetName, startRow = 6, endRow = 50) {
    const range = `${sheetName}!A${startRow}:BD${endRow}`;
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range,
    });
    return response.data.values || [];
}

// ============================================
// DETEKSI KOLOM DINAMIS DARI HEADER
// Beberapa sheet Polres menyisipkan kolom ekstra (mis. "Jumlah LP")
// sehingga posisi kolom bergeser. Kita baca baris header (4-5) dan
// petakan field berdasarkan teks judulnya, bukan posisi tetap.
// ============================================
async function fetchHeaderRows(sheetName, headerStart = 4, headerEnd = 5) {
    const range = `${sheetName}!A${headerStart}:BD${headerEnd}`;
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range,
    });
    return response.data.values || [];
}

function norm(s) {
    return (s || "").toString().toLowerCase().replace(/\s+/g, " ").trim();
}

// Bangun mapping { colIndex: fieldName } dari 2 baris header (main + sub).
// Mengembalikan null jika field kunci tidak terdeteksi (fallback ke statis).
function detectColumnMapping(headerRows) {
    if (!headerRows || headerRows.length === 0) return null;

    const main = headerRows[0] || [];
    const sub = headerRows[1] || [];
    const width = Math.max(main.length, sub.length);

    const mapping = {};
    // Kolom 0 = bulan (selalu paling kiri, berisi nama bulan pada baris data)
    mapping[0] = "bulan";

    let kendGroup = null; // 'korban' | 'penjamin' saat menelusuri kolom kendaraan

    for (let i = 0; i < width; i++) {
        const m = norm(main[i]);
        const s = norm(sub[i]);
        const h = s || m; // sub header lebih spesifik

        // Update grup kendaraan saat menemui judul grup di baris main
        if (m.includes("kend korban") || m.includes("kend. korban") || m.includes("kendaraan korban")) {
            kendGroup = "korban";
        } else if (
            m.includes("kendaraan penjamin") || m.includes("kend penjamin") ||
            m.includes("kend. 2") || m.includes("kend 2") || m.includes("kendaraan 2")
        ) {
            kendGroup = "penjamin";
        }

        // Kolom kendaraan (Jenis / Nopol / Masa Laku SW) → tergantung grup aktif
        if (h === "jenis" || h === "nopol" || h.includes("masa laku")) {
            if (kendGroup === "korban") {
                if (h === "jenis") mapping[i] = "jenis_kendaraan_korban";
                else if (h === "nopol") mapping[i] = "nopol_korban";
                else mapping[i] = "masa_laku_sw_korban";
            } else if (kendGroup === "penjamin") {
                if (h === "jenis") mapping[i] = "jenis_kendaraan_penjamin";
                else if (h === "nopol") mapping[i] = "nopol_penjamin";
                else mapping[i] = "masa_laku_sw_penjamin";
            }
            continue;
        }

        if (h === "no") { mapping[i] = "nomor_urut"; continue; }
        if (h.includes("no lp")) { mapping[i] = "no_lp"; continue; }
        if (h.includes("nama korban")) { mapping[i] = "nama_korban"; continue; }
        if (h.includes("usia")) { mapping[i] = "usia"; continue; }
        if (h.includes("profesi")) { mapping[i] = "profesi"; continue; }
        if (h.includes("tanggal laka")) { mapping[i] = "tanggal_laka"; continue; }
        if (h.includes("tanggal lp")) { mapping[i] = "tanggal_lp"; continue; }
        if (h.includes("lp terlambat") || h.includes("terlambat")) { mapping[i] = "lp_terlambat"; continue; }
        if (h.includes("kecamatan")) { mapping[i] = "kecamatan"; continue; }
        if (h.includes("kelurahan")) { mapping[i] = "kelurahan"; continue; }
        if (h.includes("lokasi laka") || h === "lokasi") { mapping[i] = "lokasi_laka"; continue; }
        if (h.includes("wil. sendiri") || h.includes("wil sendiri")) { mapping[i] = "rs_sendiri"; continue; }
        if (h.includes("wil lain") || h.includes("wil. lain")) { mapping[i] = "rs_lain"; continue; }
        if (h.includes("laka tunggal")) { mapping[i] = "laka_tunggal"; continue; }
        if (h.includes("tindak lanjut")) { mapping[i] = "tindak_lanjut"; continue; }
        if (h === "cidera" || h.includes("cidera")) { mapping[i] = "cidera"; continue; }
        if (h.includes("jenis jaminan")) { mapping[i] = "jenis_jaminan"; continue; }
        if (h.includes("keterjaminan")) { mapping[i] = "keterjaminan"; continue; }
        if (h.includes("kasus tabrak")) { mapping[i] = "kasus_tabrakan"; continue; }
        if (h.includes("faktor penyebab")) { mapping[i] = "faktor_penyebab"; continue; }
        if (h.includes("sifat laka")) { mapping[i] = "sifat_laka"; continue; }
        if (h.includes("keterangan")) { mapping[i] = "keterangan"; continue; }
        if (h.includes("hari")) { mapping[i] = "hari"; continue; }
    }

    // Validasi: field kunci wajib terdeteksi, jika tidak → fallback statis
    const detected = Object.values(mapping);
    const hasKey = detected.includes("no_lp") && detected.includes("tanggal_laka") && detected.includes("nama_korban");
    if (!hasKey) return null;

    // Kolom BD (index 55) sebagai fallback nama hari bila belum terdeteksi
    if (!detected.includes("hari")) mapping[55] = "hari";

    return mapping;
}

// ============================================
// PARSE ROWS → objek per baris
// ============================================
function parseRows(rows, startRow = 6, columnMapping = COLUMN_MAPPING) {
    if (!rows || rows.length === 0) return [];

    const parsed = [];

    // Cari index kolom nomor_urut (default kolom 1) dari mapping aktif
    let nomorUrutIdx = 1;
    for (const key of Object.keys(columnMapping)) {
        if (columnMapping[key] === "nomor_urut") { nomorUrutIdx = parseInt(key); break; }
    }

    rows.forEach((row, index) => {
        if (!row || row.every((cell) => !cell || cell.toString().trim() === "")) return;

        const obj = {
            baris: index + startRow,
            nomor_urut: parseInt(row[nomorUrutIdx]) || 0,
        };

        Object.keys(columnMapping).forEach((key) => {
            const idx = parseInt(key);
            const fieldName = columnMapping[key];
            obj[fieldName] = idx < row.length ? row[idx] || "" : "";
        });

        if (obj.nama_korban || obj.no_lp) {
            parsed.push(obj);
        }
    });

    // Pertahankan urutan fisik baris sheet (jangan diurut ulang by nomor_urut)
    return parsed;
}

// ============================================
// GROUP BY NO LP
// ============================================
function groupByLp(parsedData) {
    const grouped = {};

    parsedData.forEach((item) => {
        const noLp = item.no_lp || "";
        if (!noLp) return;

        if (!grouped[noLp]) {
            grouped[noLp] = {
                laporan: {
                    no_lp: noLp,
                    tanggal_laka: item.tanggal_laka || "",
                    tanggal_lp: item.tanggal_lp || "",
                    lp_terlambat: item.lp_terlambat || "",
                    kecamatan: item.kecamatan || "",
                    kelurahan: item.kelurahan || "",
                    lokasi_laka: item.lokasi_laka || "",
                    rs_sendiri: item.rs_sendiri || "",
                    rs_lain: item.rs_lain || "",
                    laka_tunggal: item.laka_tunggal || "",
                    kasus_tabrakan: item.kasus_tabrakan || "",
                    faktor_penyebab: item.faktor_penyebab || "",
                    sifat_laka: item.sifat_laka || "",
                    keterangan: item.keterangan || "",
                    bulan: item.bulan || "",
                    hari_kejadian: item.hari_kejadian || "",
                    hari: item.hari || "",
                    nomor_urut: item.nomor_urut || 0,
                    // Posisi baris pertama LP ini di sheet — untuk menjaga urutan tampil
                    _baris: item.baris || 0,
                },
                kendaraan: [],
                korban: [],
            };
        }

        const korbanData = {
            nama: item.nama_korban || "",
            usia: item.usia || "",
            profesi: item.profesi || "",
            cidera: item.cidera || "",
            tindak_lanjut: item.tindak_lanjut || "",
            jenis_jaminan: item.jenis_jaminan || "",
            keterjaminan: item.keterjaminan || "",
            nopol_korban: item.nopol_korban || "",
            nopol_penjamin: item.nopol_penjamin || "",
            jenis_kendaraan_korban: item.jenis_kendaraan_korban || "",
            jenis_kendaraan_penjamin: item.jenis_kendaraan_penjamin || "",
            masa_laku_sw_korban: item.masa_laku_sw_korban || "",
            masa_laku_sw_penjamin: item.masa_laku_sw_penjamin || "",
            kendaraan_index: null,
        };
        grouped[noLp].korban.push(korbanData);

        const kendaraanList = [];
        if (item.nopol_korban) {
            kendaraanList.push({
                nopol: item.nopol_korban || "",
                jenis_kendaraan: item.jenis_kendaraan_korban || "",
                masa_laku_sw: item.masa_laku_sw_korban || "",
            });
        }
        if (item.nopol_penjamin) {
            kendaraanList.push({
                nopol: item.nopol_penjamin || "",
                jenis_kendaraan: item.jenis_kendaraan_penjamin || "",
                masa_laku_sw: item.masa_laku_sw_penjamin || "",
            });
        }

        kendaraanList.forEach((k) => {
            if (!k.nopol) return;
            const exists = grouped[noLp].kendaraan.some((existing) => existing.nopol === k.nopol);
            if (!exists) {
                grouped[noLp].kendaraan.push({
                    nopol: k.nopol,
                    jenis_kendaraan: k.jenis_kendaraan,
                    masa_laku_sw: k.masa_laku_sw,
                    peran: null,
                });
            }
        });
    });

    // Tentukan peran kendaraan + kaitkan korban → index kendaraan
    Object.keys(grouped).forEach((noLp) => {
        const group = grouped[noLp];

        group.korban.forEach((korban) => {
            if (korban.nopol_korban) {
                const idx = group.kendaraan.findIndex((k) => k.nopol === korban.nopol_korban);
                if (idx !== -1) {
                    korban.kendaraan_index = idx;
                    if (!group.kendaraan[idx].peran) group.kendaraan[idx].peran = "korban";
                }
            }

            if (korban.nopol_penjamin && korban.kendaraan_index === null) {
                const idx = group.kendaraan.findIndex((k) => k.nopol === korban.nopol_penjamin);
                if (idx !== -1) {
                    korban.kendaraan_index = idx;
                    if (!group.kendaraan[idx].peran) group.kendaraan[idx].peran = "penjamin";
                }
            }

            if (korban.kendaraan_index === null) {
                const idx = group.kendaraan.findIndex((k) => k.peran === "korban");
                if (idx !== -1) korban.kendaraan_index = idx;
            }
        });

        // Mark kendaraan penjamin yang belum berperan
        group.kendaraan.forEach((k) => {
            if (!k.peran) k.peran = "penjamin";
        });

        group.korban.forEach((k) => {
            delete k.nopol_korban;
            delete k.nopol_penjamin;
            delete k.jenis_kendaraan_korban;
            delete k.jenis_kendaraan_penjamin;
            delete k.masa_laku_sw_korban;
            delete k.masa_laku_sw_penjamin;
        });
    });

    return grouped;
}

module.exports = {
    SPREADSHEET_ID,
    COLUMN_MAPPING,
    HARI_MAPPING,
    KENDARAAN_KEYWORD_MAP,
    formatDate,
    formatMasaLakuSW,
    stringSimilarity,
    findBestMatch,
    lookup,
    lookupId,
    lookupPolresIdByKecamatan,
    fetchSheetRows,
    fetchHeaderRows,
    detectColumnMapping,
    parseRows,
    groupByLp,
};
