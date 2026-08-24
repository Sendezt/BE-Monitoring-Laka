const User = require("./User");
const Wilayah = require("./Wilayah");
const Polres = require("./Polres");
const RumahSakit = require("./RumahSakit");
const Kecamatan = require("./Kecamatan");
const Kelurahan = require("./Kelurahan");
const Profesi = require("./Profesi");
const TindakLanjut = require("./TindakLanjut");
const Cidera = require("./Cidera");
const KasusTabrakKecelakaan = require("./KasusTabrakKecelakaan");
const FaktorPenyebabLaka = require("./FaktorPenyebabLaka");
const SifatLaka = require("./SifatLaka");
const Keterjaminan = require("./Keterjaminan");
const JenisKendaraan = require("./JenisKendaraan");
const JenisJaminan = require("./JenisJaminan");
const LaporanPolisi = require("./LaporPolisi");
const Kendaraan = require("./Kendaraan");
const Korban = require("./Korban");
const ActivityLog = require("./ActivityLog");

// =========================
// Wilayah → User
// =========================

Wilayah.hasMany(User, {
  foreignKey: "wilayah_id",
  as: "users",
});

User.belongsTo(Wilayah, {
  foreignKey: "wilayah_id",
  as: "wilayah",
});

// =========================
// Wilayah → Polres
// =========================

Wilayah.hasMany(Polres, {
  foreignKey: "wilayah_id",
  as: "polres",
});

Polres.belongsTo(Wilayah, {
  foreignKey: "wilayah_id",
  as: "wilayah",
});

// =========================
// Wilayah → Rumah Sakit
// =========================

Wilayah.hasMany(RumahSakit, {
  foreignKey: "wilayah_id",
  as: "rumah_sakit",
});

RumahSakit.belongsTo(Wilayah, {
  foreignKey: "wilayah_id",
  as: "wilayah",
});

// =========================
// Polres → Kecamatan
// =========================

Polres.hasMany(Kecamatan, {
  foreignKey: "polres_id",
  as: "kecamatan",
});

Kecamatan.belongsTo(Polres, {
  foreignKey: "polres_id",
  as: "polres",
});

// =========================
// Kecamatan → Kelurahan
// =========================

Kecamatan.hasMany(Kelurahan, {
  foreignKey: "kecamatan_id",
  as: "kelurahan",
});

Kelurahan.belongsTo(Kecamatan, {
  foreignKey: "kecamatan_id",
  as: "kecamatan",
});

// Polres -> Laporan Polisi
Polres.hasMany(LaporanPolisi, {
  foreignKey: "polres_id",
  as: "laporanPolisi",
});

LaporanPolisi.belongsTo(Polres, {
  foreignKey: "polres_id",
  as: "polres",
});

// Kecamatan -> LaporanPolisi
Kecamatan.hasMany(LaporanPolisi, {
  foreignKey: "kecamatan_id",
  as: "laporanPolisi",
});

LaporanPolisi.belongsTo(Kecamatan, {
  foreignKey: "kecamatan_id",
  as: "kecamatan",
});

// Kelurahan -> LaporanPolisi
Kelurahan.hasMany(LaporanPolisi, {
  foreignKey: "kelurahan_id",
  as: "laporanPolisi",
});

LaporanPolisi.belongsTo(Kelurahan, {
  foreignKey: "kelurahan_id",
  as: "kelurahan",
});

// Rumah Sakit -> Korban
RumahSakit.hasMany(Korban, {
  foreignKey: "rumah_sakit_id",
  as: "korban",
});

Korban.belongsTo(RumahSakit, {
  foreignKey: "rumah_sakit_id",
  as: "rumahSakit",
});

// Tindak Lanjut -> Korban
TindakLanjut.hasMany(Korban, {
  foreignKey: "tindak_lanjut_id",
  as: "korban",
});

Korban.belongsTo(TindakLanjut, {
  foreignKey: "tindak_lanjut_id",
  as: "tindakLanjut",
});

// Jenis Jaminan -> Korban
JenisJaminan.hasMany(Korban, {
  foreignKey: "jenis_jaminan_id",
  as: "korban",
});

Korban.belongsTo(JenisJaminan, {
  foreignKey: "jenis_jaminan_id",
  as: "jenisJaminan",
});

// Keterjaminan -> Korban
Keterjaminan.hasMany(Korban, {
  foreignKey: "keterjaminan_id",
  as: "korban",
});

Korban.belongsTo(Keterjaminan, {
  foreignKey: "keterjaminan_id",
  as: "keterjaminan",
});

// Sifat Laka -> LaporanPolisi
SifatLaka.hasMany(LaporanPolisi, {
  foreignKey: "sifat_laka_id",
  as: "laporanPolisi",
});

LaporanPolisi.belongsTo(SifatLaka, {
  foreignKey: "sifat_laka_id",
  as: "sifatLaka",
});

// Kasus Tabrak Kecelakaan -> LaporanPolisi
KasusTabrakKecelakaan.hasMany(LaporanPolisi, {
  foreignKey: "kasus_tabrak_kecelakaan_id",
  as: "laporanPolisi",
});

LaporanPolisi.belongsTo(KasusTabrakKecelakaan, {
  foreignKey: "kasus_tabrak_kecelakaan_id",
  as: "kasusTabrakKecelakaan",
});

// Faktor Penyebab Laka -> LaporanPolisi
FaktorPenyebabLaka.hasMany(LaporanPolisi, {
  foreignKey: "faktor_penyebab_laka_id",
  as: "laporanPolisi",
});

LaporanPolisi.belongsTo(FaktorPenyebabLaka, {
  foreignKey: "faktor_penyebab_laka_id",
  as: "faktorPenyebabLaka",
});

// Laporan Polisi -> Kendaraan
LaporanPolisi.hasMany(Kendaraan, {
  foreignKey: "laporan_polisi_id",
  as: "kendaraan",
});

Kendaraan.belongsTo(LaporanPolisi, {
  foreignKey: "laporan_polisi_id",
  as: "laporanPolisi",
});

// Jenis Kendaraan -> Kendaraan
JenisKendaraan.hasMany(Kendaraan, {
  foreignKey: "jenis_kendaraan_id",
  as: "kendaraan",
});

Kendaraan.belongsTo(JenisKendaraan, {
  foreignKey: "jenis_kendaraan_id",
  as: "jenisKendaraan",
});

// Laporan Polisi → Korban
LaporanPolisi.hasMany(Korban, {
  foreignKey: "laporan_polisi_id",
  as: "korban",
});

Korban.belongsTo(LaporanPolisi, {
  foreignKey: "laporan_polisi_id",
  as: "laporanPolisi",
});

// Profesi → Korban
Profesi.hasMany(Korban, {
  foreignKey: "profesi_id",
  as: "korban",
});

Korban.belongsTo(Profesi, {
  foreignKey: "profesi_id",
  as: "profesi",
});

// Cidera → Korban
Cidera.hasMany(Korban, {
  foreignKey: "cidera_id",
  as: "korban",
});

Korban.belongsTo(Cidera, {
  foreignKey: "cidera_id",
  as: "cidera",
});

// Kendaraan → Korban
Kendaraan.hasMany(Korban, {
  foreignKey: "kendaraan_id",
  as: "korban",
});

Korban.belongsTo(Kendaraan, {
  foreignKey: "kendaraan_id",
  as: "kendaraan",
});

// =========================
// User → LaporanPolisi
// =========================

User.hasMany(LaporanPolisi, {
  foreignKey: "user_id",
  as: "laporanPolisi",
});

LaporanPolisi.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

// =========================
// User → ActivityLog
// =========================

User.hasMany(ActivityLog, {
  foreignKey: "user_id",
  as: "activityLogs",
});

ActivityLog.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

module.exports = {
  User,
  Wilayah,
  Polres,
  RumahSakit,
  Kecamatan,
  Kelurahan,
  Profesi,
  TindakLanjut,
  KasusTabrakKecelakaan,
  FaktorPenyebabLaka,
  SifatLaka,
  Cidera,
  Keterjaminan,
  JenisKendaraan,
  JenisJaminan,
  LaporanPolisi,
  Kendaraan,
  Korban,
  ActivityLog,
};
