const { SifatLaka } = require("../models");

const {
  successResponse,
  errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// GET /api/sifat-laka
const getSifatLaka = async (req, res) => {
  try {
    const sifatLaka = await SifatLaka.findAll({
      where: {
        is_active: true,
      },
      order: [["nama", "ASC"]],
    });

    return successResponse(
      res,
      200,
      "Sifat laka retrieved successfully",
      sifatLaka
    );
  } catch (error) {
    logger.error(
      "Get sifat laka error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to retrieve sifat laka"
    );
  }
};

// GET /api/sifat-laka/:id
const getSifatLakaById = async (req, res) => {
  try {
    const { id } = req.params;

    const sifatLaka =
      await SifatLaka.findByPk(id);

    if (
      !sifatLaka ||
      !sifatLaka.is_active
    ) {
      return errorResponse(
        res,
        404,
        "Sifat laka not found"
      );
    }

    return successResponse(
      res,
      200,
      "Sifat laka retrieved successfully",
      sifatLaka
    );
  } catch (error) {
    logger.error(
      "Get sifat laka by ID error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to retrieve sifat laka"
    );
  }
};

// POST /api/sifat-laka
const createSifatLaka = async (req, res) => {
  try {
    const { nama } = req.body;

    // Validate required field
    if (!nama || !nama.trim()) {
      return errorResponse(
        res,
        400,
        "Nama is required"
      );
    }

    const normalizedNama = nama.trim();

    // Check duplicate
    const existingSifatLaka =
      await SifatLaka.findOne({
        where: {
          nama: normalizedNama,
        },
      });

    if (existingSifatLaka) {
      if (!existingSifatLaka.is_active) {
        return errorResponse(
          res,
          409,
          "Sifat laka already exists but is inactive"
        );
      }

      return errorResponse(
        res,
        409,
        "Sifat laka already exists"
      );
    }

    const sifatLaka =
      await SifatLaka.create({
        nama: normalizedNama,
        is_active: true,
      });

    return successResponse(
      res,
      201,
      "Sifat laka created successfully",
      sifatLaka
    );
  } catch (error) {
    logger.error(
      "Create sifat laka error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to create sifat laka"
    );
  }
};

// PUT /api/sifat-laka/:id
const updateSifatLaka = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama } = req.body;

    // Validate required field
    if (!nama || !nama.trim()) {
      return errorResponse(
        res,
        400,
        "Nama is required"
      );
    }

    const sifatLaka =
      await SifatLaka.findByPk(id);

    if (
      !sifatLaka ||
      !sifatLaka.is_active
    ) {
      return errorResponse(
        res,
        404,
        "Sifat laka not found"
      );
    }

    const normalizedNama = nama.trim();

    // Check duplicate
    const existingSifatLaka =
      await SifatLaka.findOne({
        where: {
          nama: normalizedNama,
        },
      });

    if (
      existingSifatLaka &&
      existingSifatLaka.id !==
        sifatLaka.id
    ) {
      return errorResponse(
        res,
        409,
        "Sifat laka already exists"
      );
    }

    await sifatLaka.update({
      nama: normalizedNama,
    });

    return successResponse(
      res,
      200,
      "Sifat laka updated successfully",
      sifatLaka
    );
  } catch (error) {
    logger.error(
      "Update sifat laka error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to update sifat laka"
    );
  }
};

// DELETE /api/sifat-laka/:id
const deleteSifatLaka = async (req, res) => {
  try {
    const { id } = req.params;

    const sifatLaka =
      await SifatLaka.findByPk(id);

    if (
      !sifatLaka ||
      !sifatLaka.is_active
    ) {
      return errorResponse(
        res,
        404,
        "Sifat laka not found"
      );
    }

    // Soft delete
    await sifatLaka.update({
      is_active: false,
    });

    return successResponse(
      res,
      200,
      "Sifat laka deleted successfully",
      null
    );
  } catch (error) {
    logger.error(
      "Delete sifat laka error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to delete sifat laka"
    );
  }
};

module.exports = {
  getSifatLaka,
  getSifatLakaById,
  createSifatLaka,
  updateSifatLaka,
  deleteSifatLaka,
};
