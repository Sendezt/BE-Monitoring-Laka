const User = require("./User");
const Wilayah = require("./Wilayah");

Wilayah.hasMany(User, {
    foreignKey: "wilayah_id",
    as: "users",
});

User.belongsTo(Wilayah, {
    foreignKey: "wilayah_id",
    as: "wilayah",
});

module.exports = {
    User,
    Wilayah,
};