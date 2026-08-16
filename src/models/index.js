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
const LaporanPolisi = require("./LaporPolisi")
const Kendaraan = require("./Kendaraan");

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

// Rumah Sakit -> LaporanPolisi
RumahSakit.hasMany(LaporanPolisi, {
  foreignKey: "rumah_sakit_id",
  as: "laporanPolisi",
});

LaporanPolisi.belongsTo(RumahSakit, {
  foreignKey: "rumah_sakit_id",
  as: "rumahSakit",
});

// Tidak Lanjut -> LaporanPolisi
TidakLanjut.hasMany(LaporanPolisi, {
  foreignKey: "tindak_lanjut_id",
  as: "laporanPolisi",
});

LaporanPolisi.belongsTo(TidakLanjut, {
  foreignKey: "tindak_lanjut_id",
  as: "tindakLanjut",
});

// Jenis Jaminan -> LaporanPolisi
JenisJaminan.hasMany(LaporanPolisi, {
  foreignKey: "jenis_jaminan_id",
  as: "laporanPolisi",
});

LaporanPolisi.belongsTo(JenisJaminan, {
  foreignKey: "jenis_jaminan_id",
  as: "jenisJaminan",
});

// Keterjaminan -> LaporanPolisi
Keterjaminan.hasMany(LaporanPolisi, {
  foreignKey: "keterjaminan_id",
  as: "laporanPolisi",
});

LaporanPolisi.belongsTo(Keterjaminan, {
  foreignKey: "keterjaminan_id",
  as: "laporanPolisi",
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
};