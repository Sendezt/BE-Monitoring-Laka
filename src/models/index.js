const User = require("./User");
const Wilayah = require("./Wilayah");
const Polres = require("./Polres");
const RumahSakit = require("./RumahSakit");

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

module.exports = {
    User,
    Wilayah,
    Polres,
    RumahSakit,
};