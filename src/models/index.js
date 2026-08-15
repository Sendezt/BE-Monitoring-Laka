const User = require("./User");
const Wilayah = require("./Wilayah");
const Polres = require("./Polres");
const RumahSakit = require("./RumahSakit");
const Kecamatan = require("./Kecamatan");

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

module.exports = {
    User,
    Wilayah,
    Polres,
    RumahSakit,
    Kecamatan,
};