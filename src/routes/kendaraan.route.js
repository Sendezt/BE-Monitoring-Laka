const express = require("express");

const {
    getKendaraan,
    getKendaraanById,
    createKendaraan,
    updateKendaraan,
    deleteKendaraan,
} = require("../controllers/kendaraan.controller");

const router = express.Router();

const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

router.get("/", verifyToken, getKendaraan);

router.get("/:id", verifyToken, getKendaraanById);

router.post("/", verifyToken, createKendaraan);

router.put("/:id", verifyToken, updateKendaraan);

router.delete("/:id", verifyToken, checkRole(["admin"]), deleteKendaraan);

module.exports = router;

