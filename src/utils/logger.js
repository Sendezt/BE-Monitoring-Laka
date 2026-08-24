// src/utils/logger.js
// Logger terpusat — level: INFO, WARN, ERROR, DEBUG, PROGRESS
// + helpers visual: section, sub, table, list, separator
// + helpers diagnostik migrasi: lakaTunggalSummary, lakaTunggalPayloadSummary

// ─────────────────────────────────────────────────────────────
// Timestamp WIB (Asia/Jakarta) format: YYYY-MM-DD HH:mm:ss WIB
// ─────────────────────────────────────────────────────────────
function wibTimestamp() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")} WIB`;
}

// Safe-print nilai apapun (null/undefined/empty string terlihat jelas)
function fmt(val) {
  if (val === null) return "(null)";
  if (val === undefined) return "(undefined)";
  if (val === "") return '""';
  return String(val);
}

function sepLine(char, length) {
  return char.repeat(length || 60);
}

// ─────────────────────────────────────────────────────────────
// Logger
// ─────────────────────────────────────────────────────────────
const logger = {

  // ── Level standar ─────────────────────────────────────────

  info: (message) => {
    console.log(`[INFO]  [${wibTimestamp()}] ${message}`);
  },

  warn: (message) => {
    console.warn(`[WARN]  [${wibTimestamp()}] ${message}`);
  },

  error: (message, error = null) => {
    console.error(`[ERROR] [${wibTimestamp()}] ${message}`);
    if (error) {
      const sqlMsg = error?.parent?.sqlMessage || error?.original?.sqlMessage;
      if (sqlMsg) console.error(`        SQL    : ${sqlMsg}`);
      const seqMsg = error?.errors?.[0]?.message;
      if (seqMsg) console.error(`        Seq    : ${seqMsg}`);
      console.error(error);
    }
  },

  // Aktif hanya bila LOG_LEVEL=debug
  debug: (message) => {
    if (process.env.LOG_LEVEL === "debug") {
      console.log(`[DEBUG] [${wibTimestamp()}] ${message}`);
    }
  },

  // ── Progress dengan scope tag ──────────────────────────────

  // [timestamp] [SCOPE   ] pesan
  progress: (scope, message) => {
    console.log(`[${wibTimestamp()}] [${String(scope).padEnd(8)}] ${message}`);
  },

  // ── Helpers visual ────────────────────────────────────────

  // Header blok baru (double-line)
  section: (title) => {
    const line = sepLine("=", 60);
    console.log(`\n${line}`);
    console.log(`  ${title}`);
    console.log(`${line}`);
  },

  // Sub-header (single-line tipis)
  sub: (title) => {
    const pad = Math.max(0, 52 - String(title).length);
    console.log(`  -- ${title} ${sepLine("-", pad)}`);
  },

  // Garis pemisah
  separator: () => {
    console.log(`  ${sepLine("-", 60)}`);
  },

  // Tabel key-value rata kiri
  table: (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) return;
    const maxKey = Math.max(...rows.map((r) => String(r[0]).length));
    for (const [key, val] of rows) {
      console.log(`    ${String(key).padEnd(maxKey + 2)}: ${fmt(val)}`);
    }
  },

  // List bullet
  list: (items, bullet) => {
    if (!Array.isArray(items) || items.length === 0) return;
    const b = bullet || "-";
    for (const item of items) {
      console.log(`    ${b} ${item}`);
    }
  },

  // ── Diagnostik khusus MIGRASI: laka_tunggal ───────────────

  // Panggil SETELAH groupByLp — tampilkan semua nilai unik raw
  // dari sheet beserta hitungannya, lalu klasifikasi ke bucket.
  lakaTunggalSummary: (scope, groupedData) => {
    const rawValues = new Map();
    let cTunggal = 0, cNonTunggal = 0, cKosong = 0;
    const lainnya = [];

    for (const noLp of Object.keys(groupedData)) {
      const raw = groupedData[noLp].laporan.laka_tunggal;
      const rawStr = fmt(raw);
      rawValues.set(rawStr, (rawValues.get(rawStr) || 0) + 1);

      const norm = String(raw || "").trim().toUpperCase();
      if (norm === "TRUE" || norm === "YA" || norm === "Y" || norm === "1") {
        cTunggal++;
      } else if (norm === "" || norm === '""') {
        cKosong++;
      } else if (norm === "FALSE" || norm === "TIDAK" || norm === "0") {
        cNonTunggal++;
      } else {
        lainnya.push({ noLp, raw: rawStr });
        cNonTunggal++; // dianggap non-tunggal oleh migrasi.controller
      }
    }

    const total = cTunggal + cNonTunggal + cKosong;

    console.log(`\n  [${scope}] DISTRIBUSI LAKA_TUNGGAL — raw dari sheet:`);
    console.log(`    Total LP grouped   : ${total}`);
    console.log(`    Tunggal  (TRUE/Ya) : ${cTunggal}`);
    console.log(`    NonTunggal(FALSE)  : ${cNonTunggal}`);
    console.log(`    Kosong/""          : ${cKosong}  << akan jadi false saat disimpan`);

    console.log(`\n    Semua nilai unik kolom laka_tunggal di sheet:`);
    for (const [val, count] of [...rawValues.entries()].sort((a, b) => b[1] - a[1])) {
      const marker =
        val === '""' || val === "(null)" || val === "(undefined)" ? " << KOSONG" :
        val.toUpperCase() === "TRUE" ? " << tunggal" :
        val.toUpperCase() === "FALSE" ? " << non-tunggal" : " << tidak dikenal";
      console.log(`      ${String(count).padStart(4)}x  |  ${String(val).padEnd(12)}${marker}`);
    }

    if (lainnya.length > 0) {
      console.log(`\n    Nilai TIDAK DIKENAL (dianggap non-tunggal):`);
      for (const item of lainnya.slice(0, 10)) {
        console.log(`      No LP: ${String(item.noLp).padEnd(20)}  raw: ${item.raw}`);
      }
      if (lainnya.length > 10) {
        console.log(`      ... dan ${lainnya.length - 10} lainnya`);
      }
    }
  },

  // Panggil SETELAH mapGroupToPayload — tampilkan distribusi boolean
  // hasil konversi agar bisa dibandingkan dengan lakaTunggalSummary.
  lakaTunggalPayloadSummary: (scope, payloads) => {
    let cTrue = 0, cFalse = 0;
    for (const p of payloads) {
      if (p.laka_tunggal === true) cTrue++;
      else cFalse++;
    }
    const total = cTrue + cFalse;
    const pct = (n) => (total ? ((n / total) * 100).toFixed(1) : "0.0") + "%";

    console.log(`\n  [${scope}] PAYLOAD LAKA_TUNGGAL — setelah konversi ke boolean:`);
    console.log(`    Total payload      : ${total}`);
    console.log(`    laka_tunggal=true  : ${cTrue.toString().padStart(4)}  (${pct(cTrue)})`);
    console.log(`    laka_tunggal=false : ${cFalse.toString().padStart(4)}  (${pct(cFalse)})`);
    console.log(`    >> Bandingkan dengan DISTRIBUSI RAW di atas.`);
    console.log(`    >> Jika tunggal raw != true di sini, cek nilai kolom sheet.`);
  },

  wibTimestamp,
  fmt,
};

module.exports = logger;
