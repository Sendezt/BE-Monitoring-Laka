const { FaktorPenyebabLaka } = require("../models");

const {
  successResponse,
  errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// GET /api/faktor-penyebab-laka
const getFaktorPenyebabLaka = async (req, res) => {
  try {
    const faktorPenyebab = await FaktorPenyebabLaka.findAll({
      where: {
        is_active: true,
      },
      order: [["nama", "ASC"]],
    });

    return successResponse(
      res,
      200,
      "Faktor penyebab laka retrieved successfully",
      faktorPenyebab
    );
  } catch (error) {
    logger.error(
      "Get faktor penyebab laka error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to retrieve faktor penyebab laka"
    );
  }
};

// GET /api/faktor-penyebab-laka/:id
const getFaktorPenyebabLakaById = async (req, res) => {
  try {
    const { id } = req.params;

    const faktorPenyebab =
      await FaktorPenyebabLaka.findByPk(id);

    if (
      !faktorPenyebab ||
      !faktorPenyebab.is_active
    ) {
      return errorResponse(
        res,
        404,
        "Faktor penyebab laka not found"
      );
    }

    return successResponse(
      res,
      200,
      "Faktor penyebab laka retrieved successfully",
      faktorPenyebab
    );
  } catch (error) {
    logger.error(
      "Get faktor penyebab laka by ID error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to retrieve faktor penyebab laka"
    );
  }
};

// POST /api/faktor-penyebab-laka
const createFaktorPenyebabLaka = async (req, res) => {
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
    const existingFaktorPenyebab =
      await FaktorPenyebabLaka.findOne({
        where: {
          nama: normalizedNama,
        },
      });

    if (existingFaktorPenyebab) {
      if (!existingFaktorPenyebab.is_active) {
        return errorResponse(
          res,
          409,
          "Faktor penyebab laka already exists but is inactive"
        );
      }

      return errorResponse(
        res,
        409,
        "Faktor penyebab laka already exists"
      );
    }

    const faktorPenyebab =
      await FaktorPenyebabLaka.create({
        nama: normalizedNama,
        is_active: true,
      });

    return successResponse(
      res,
      201,
      "Faktor penyebab laka created successfully",
      faktorPenyebab
    );
  } catch (error) {
    logger.error(
      "Create faktor penyebab laka error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to create faktor penyebab laka"
    );
  }
};

// PUT /api/faktor-penyebab-laka/:id
const updateFaktorPenyebabLaka = async (req, res) => {
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

    const faktorPenyebab =
      await FaktorPenyebabLaka.findByPk(id);

    if (
      !faktorPenyebab ||
      !faktorPenyebab.is_active
    ) {
      return errorResponse(
        res,
        404,
        "Faktor penyebab laka not found"
      );
    }

    const normalizedNama = nama.trim();

    // Check duplicate
    const existingFaktorPenyebab =
      await FaktorPenyebabLaka.findOne({
        where: {
          nama: normalizedNama,
        },
      });

    if (
      existingFaktorPenyebab &&
      existingFaktorPenyebab.id !==
        faktorPenyebab.id
    ) {
      return errorResponse(
        res,
        409,
        "Faktor penyebab laka already exists"
      );
    }

    await faktorPenyebab.update({
      nama: normalizedNama,
    });

    return successResponse(
      res,
      200,
      "Faktor penyebab laka updated successfully",
      faktorPenyebab
    );
  } catch (error) {
    logger.error(
      "Update faktor penyebab laka error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to update faktor penyebab laka"
    );
  }
};

// DELETE /api/faktor-penyebab-laka/:id
const deleteFaktorPenyebabLaka = async (req, res) => {
  try {
    const { id } = req.params;

    const faktorPenyebab =
      await FaktorPenyebabLaka.findByPk(id);

    if (
      !faktorPenyebab ||
      !faktorPenyebab.is_active
    ) {
      return errorResponse(
        res,
        404,
        "Faktor penyebab laka not found"
      );
    }

    // Soft delete
    await faktorPenyebab.update({
      is_active: false,
    });

    return successResponse(
      res,
      200,
      "Faktor penyebab laka deleted successfully",
      null
    );
  } catch (error) {
    logger.error(
      "Delete faktor penyebab laka error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to delete faktor penyebab laka"
    );
  }
};

module.exports = {
  getFaktorPenyebabLaka,
  getFaktorPenyebabLakaById,
  createFaktorPenyebabLaka,
  updateFaktorPenyebabLaka,
  deleteFaktorPenyebabLaka,
};
