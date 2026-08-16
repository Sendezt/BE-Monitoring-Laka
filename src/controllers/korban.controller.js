const {
  Korban,
  LaporanPolisi,
  Profesi,
  Cidera,
  Kendaraan,
} = require("../models");

const {
  successResponse,
  errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// GET /api/korban
const getKorban = async (req, res) => {
  try {
    const korban = await Korban.findAll({
      where: {
        is_active: true,
      },

      include: [
        {
          model: LaporanPolisi,
          as: "laporanPolisi",
          attributes: ["id", "no_lp"],
        },
        {
          model: Profesi,
          as: "profesi",
          attributes: ["id", "nama"],
        },
        {
          model: Cidera,
          as: "cidera",
          attributes: ["id", "nama"],
        },
        {
          model: Kendaraan,
          as: "kendaraan",
          attributes: [
            "id",
            "peran",
            "nopol",
            "jenis_kendaraan_id",
          ],
        },
      ],

      order: [["id", "DESC"]],
    });

    return successResponse(
      res,
      200,
      "Korban retrieved successfully",
      korban
    );
  } catch (error) {
    logger.error(
      "Get korban error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to retrieve korban"
    );
  }
};

// GET /api/korban/:id
const getKorbanById = async (req, res) => {
  try {
    const { id } = req.params;

    const korban = await Korban.findByPk(id, {
      include: [
        {
          model: LaporanPolisi,
          as: "laporanPolisi",
          attributes: ["id", "no_lp"],
        },
        {
          model: Profesi,
          as: "profesi",
          attributes: ["id", "nama"],
        },
        {
          model: Cidera,
          as: "cidera",
          attributes: ["id", "nama"],
        },
        {
          model: Kendaraan,
          as: "kendaraan",
          attributes: [
            "id",
            "peran",
            "nopol",
            "jenis_kendaraan_id",
          ],
        },
      ],
    });

    if (!korban || !korban.is_active) {
      return errorResponse(
        res,
        404,
        "Korban not found"
      );
    }

    return successResponse(
      res,
      200,
      "Korban retrieved successfully",
      korban
    );
  } catch (error) {
    logger.error(
      "Get korban by ID error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to retrieve korban"
    );
  }
};

// POST /api/korban
const createKorban = async (req, res) => {
  try {
    const {
      laporan_polisi_id,
      nama,
      usia,
      profesi_id,
      cidera_id,
      kendaraan_id,
    } = req.body;

    if (
      !laporan_polisi_id ||
      !nama ||
      usia === undefined ||
      usia === null
    ) {
      return errorResponse(
        res,
        400,
        "laporan_polisi_id, nama, and usia are required"
      );
    }

    // Check laporan polisi
    const laporanPolisi =
      await LaporanPolisi.findByPk(
        laporan_polisi_id
      );

    if (
      !laporanPolisi ||
      !laporanPolisi.is_active
    ) {
      return errorResponse(
        res,
        404,
        "Laporan polisi not found"
      );
    }

    // Check profesi
    if (profesi_id !== undefined && profesi_id !== null) {
      const profesi = await Profesi.findByPk(
        profesi_id
      );

      if (!profesi || !profesi.is_active) {
        return errorResponse(
          res,
          404,
          "Profesi not found"
        );
      }
    }

    // Check cidera
    if (cidera_id !== undefined && cidera_id !== null) {
      const cidera = await Cidera.findByPk(
        cidera_id
      );

      if (!cidera || !cidera.is_active) {
        return errorResponse(
          res,
          404,
          "Cidera not found"
        );
      }
    }

    // Check kendaraan
    if (
      kendaraan_id !== undefined &&
      kendaraan_id !== null
    ) {
      const kendaraan =
        await Kendaraan.findByPk(
          kendaraan_id
        );

      if (
        !kendaraan ||
        !kendaraan.is_active
      ) {
        return errorResponse(
          res,
          404,
          "Kendaraan not found"
        );
      }

      // Pastikan kendaraan berasal dari laporan polisi yang sama
      if (
        kendaraan.laporan_polisi_id !==
        Number(laporan_polisi_id)
      ) {
        return errorResponse(
          res,
          400,
          "Kendaraan does not belong to the selected laporan polisi"
        );
      }

      // Korban harus menggunakan kendaraan dengan peran korban
      if (kendaraan.peran !== "korban") {
        return errorResponse(
          res,
          400,
          "Selected kendaraan is not assigned to korban"
        );
      }
    }

    const korban = await Korban.create({
      laporan_polisi_id,
      nama: nama.trim(),
      usia,
      profesi_id: profesi_id ?? null,
      cidera_id: cidera_id ?? null,
      kendaraan_id: kendaraan_id ?? null,
      is_active: true,
    });

    return successResponse(
      res,
      201,
      "Korban created successfully",
      korban
    );
  } catch (error) {
    logger.error(
      "Create korban error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to create korban"
    );
  }
};

// PUT /api/korban/:id
const updateKorban = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      laporan_polisi_id,
      nama,
      usia,
      profesi_id,
      cidera_id,
      kendaraan_id,
    } = req.body;

    const korban = await Korban.findByPk(id);

    if (!korban || !korban.is_active) {
      return errorResponse(
        res,
        404,
        "Korban not found"
      );
    }

    // Check laporan polisi
    if (laporan_polisi_id !== undefined) {
      const laporanPolisi =
        await LaporanPolisi.findByPk(
          laporan_polisi_id
        );

      if (
        !laporanPolisi ||
        !laporanPolisi.is_active
      ) {
        return errorResponse(
          res,
          404,
          "Laporan polisi not found"
        );
      }
    }

    // Check profesi
    if (
      profesi_id !== undefined &&
      profesi_id !== null
    ) {
      const profesi = await Profesi.findByPk(
        profesi_id
      );

      if (!profesi || !profesi.is_active) {
        return errorResponse(
          res,
          404,
          "Profesi not found"
        );
      }
    }

    // Check cidera
    if (
      cidera_id !== undefined &&
      cidera_id !== null
    ) {
      const cidera = await Cidera.findByPk(
        cidera_id
      );

      if (!cidera || !cidera.is_active) {
        return errorResponse(
          res,
          404,
          "Cidera not found"
        );
      }
    }

    // Check kendaraan
    if (
      kendaraan_id !== undefined &&
      kendaraan_id !== null
    ) {
      const kendaraan =
        await Kendaraan.findByPk(
          kendaraan_id
        );

      if (
        !kendaraan ||
        !kendaraan.is_active
      ) {
        return errorResponse(
          res,
          404,
          "Kendaraan not found"
        );
      }

      const targetLaporanId =
        laporan_polisi_id !== undefined
          ? Number(laporan_polisi_id)
          : korban.laporan_polisi_id;

      if (
        kendaraan.laporan_polisi_id !==
        targetLaporanId
      ) {
        return errorResponse(
          res,
          400,
          "Kendaraan does not belong to the selected laporan polisi"
        );
      }

      if (kendaraan.peran !== "korban") {
        return errorResponse(
          res,
          400,
          "Selected kendaraan is not assigned to korban"
        );
      }
    }

    await korban.update({
      laporan_polisi_id:
        laporan_polisi_id !== undefined
          ? laporan_polisi_id
          : korban.laporan_polisi_id,

      nama:
        nama !== undefined
          ? nama.trim()
          : korban.nama,

      usia:
        usia !== undefined
          ? usia
          : korban.usia,

      profesi_id:
        profesi_id !== undefined
          ? profesi_id
          : korban.profesi_id,

      cidera_id:
        cidera_id !== undefined
          ? cidera_id
          : korban.cidera_id,

      kendaraan_id:
        kendaraan_id !== undefined
          ? kendaraan_id
          : korban.kendaraan_id,
    });

    return successResponse(
      res,
      200,
      "Korban updated successfully",
      korban
    );
  } catch (error) {
    logger.error(
      "Update korban error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to update korban"
    );
  }
};

// DELETE /api/korban/:id
const deleteKorban = async (req, res) => {
  try {
    const { id } = req.params;

    const korban = await Korban.findByPk(id);

    if (!korban || !korban.is_active) {
      return errorResponse(
        res,
        404,
        "Korban not found"
      );
    }

    // Soft delete
    await korban.update({
      is_active: false,
    });

    return successResponse(
      res,
      200,
      "Korban deleted successfully",
      null
    );
  } catch (error) {
    logger.error(
      "Delete korban error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to delete korban"
    );
  }
};

module.exports = {
  getKorban,
  getKorbanById,
  createKorban,
  updateKorban,
  deleteKorban,
};