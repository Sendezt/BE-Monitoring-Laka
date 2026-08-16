const express = require("express");

const {
    getKendaraan,
    getKendaraanById,
    createKendaraan,
    updateKendaraan,
    deleteKendaraan,
} = require("../controllers/kendaraan.controller");

const router = express.Router();

router.get("/", getKendaraan);

router.get("/:id", getKendaraanById);

router.post("/", createKendaraan);

router.put("/:id", updateKendaraan);

router.delete("/:id", deleteKendaraan);

module.exports = router;