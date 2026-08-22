// Timestamp WIB (Asia/Jakarta) format: YYYY-MM-DD HH:mm:ss
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

const logger = {
  info: (message) => {
    console.log(`[INFO] [${wibTimestamp()}] ${message}`);
  },

  error: (message, error = null) => {
    console.error(`[ERROR] [${wibTimestamp()}] ${message}`);

    if (error) {
      console.error(error);
    }
  },

  warn: (message) => {
    console.warn(`[WARN] [${wibTimestamp()}] ${message}`);
  },

  // Log progres khusus (mis. proses migrasi) — format:
  // [timestamp WIB] [MIGRASI] pesan progres
  progress: (scope, message) => {
    console.log(`[${wibTimestamp()}] [${scope}] ${message}`);
  },

  wibTimestamp,
};

module.exports = logger;
