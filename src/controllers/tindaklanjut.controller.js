const { TindakLanjut } = require("../models");

const {
  successResponse,
  errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// GET /api/tidak-lanjut
const getTindakLanjut = async (req, res) => {
  try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await TindakLanjut.findAndCountAll({
            limit: limitNum,
            offset: offset,
      where: {
        is_active: true,
      },
      order: [["nama", "ASC"]],
    });

    return successResponse(
            res,
            200,
            "Tidak lanjut retrieved successfully",
            rows,
            {
                total: count,
                page: pageNum,
                limit: limitNum,
                total_pages: Math.ceil(count / limitNum),
            }
        );
  } catch (error) {
    logger.error(
      "Get tidak lanjut error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to retrieve tidak lanjut"
    );
  }
};

// GET /api/tidak-lanjut/:id
const getTindakLanjutById = async (req, res) => {
  try {
    const { id } = req.params;

    const tindakLanjut =
      await TindakLanjut.findByPk(id);

    if (
      !tindakLanjut ||
      !tindakLanjut.is_active
    ) {
      return errorResponse(
        res,
        404,
        "Tidak lanjut not found"
      );
    }

    return successResponse(
      res,
      200,
      "Tidak lanjut retrieved successfully",
      tindakLanjut
    );
  } catch (error) {
    logger.error(
      "Get tidak lanjut by ID error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to retrieve tidak lanjut"
    );
  }
};

// POST /api/tidak-lanjut
const createTindakLanjut = async (req, res) => {
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
    const existingTindakLanjut =
      await TindakLanjut.findOne({
        where: {
          nama: normalizedNama,
        },
      });

    if (existingTindakLanjut) {
      if (!existingTindakLanjut.is_active) {
        return errorResponse(
          res,
          409,
          "Tidak lanjut already exists but is inactive"
        );
      }

      return errorResponse(
        res,
        409,
        "Tidak lanjut already exists"
      );
    }

    const tindakLanjut =
      await TindakLanjut.create({
        nama: normalizedNama,
        is_active: true,
      });

    return successResponse(
      res,
      201,
      "Tidak lanjut created successfully",
      tindakLanjut
    );
  } catch (error) {
    logger.error(
      "Create tidak lanjut error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to create tidak lanjut"
    );
  }
};

// PUT /api/tidak-lanjut/:id
const updateTindakLanjut = async (req, res) => {
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

    const tindakLanjut =
      await TindakLanjut.findByPk(id);

    if (
      !tindakLanjut ||
      !tindakLanjut.is_active
    ) {
      return errorResponse(
        res,
        404,
        "Tidak lanjut not found"
      );
    }

    const normalizedNama = nama.trim();

    // Check duplicate
    const existingTindakLanjut =
      await TindakLanjut.findOne({
        where: {
          nama: normalizedNama,
        },
      });

    if (
      existingTindakLanjut &&
      existingTindakLanjut.id !==
        tindakLanjut.id
    ) {
      return errorResponse(
        res,
        409,
        "Tidak lanjut already exists"
      );
    }

    await tindakLanjut.update({
      nama: normalizedNama,
    });

    return successResponse(
      res,
      200,
      "Tidak lanjut updated successfully",
      tindakLanjut
    );
  } catch (error) {
    logger.error(
      "Update tidak lanjut error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to update tidak lanjut"
    );
  }
};

// DELETE /api/tidak-lanjut/:id
const deleteTindakLanjut = async (req, res) => {
  try {
    const { id } = req.params;

    const tindakLanjut =
      await TindakLanjut.findByPk(id);

    if (
      !tindakLanjut ||
      !tindakLanjut.is_active
    ) {
      return errorResponse(
        res,
        404,
        "Tidak lanjut not found"
      );
    }

    // Soft delete
    await tindakLanjut.update({
      is_active: false,
    });

    return successResponse(
      res,
      200,
      "Tidak lanjut deleted successfully",
      null
    );
  } catch (error) {
    logger.error(
      "Delete tidak lanjut error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to delete tidak lanjut"
    );
  }
};

module.exports = {
  getTindakLanjut,
  getTindakLanjutById,
  createTindakLanjut,
  updateTindakLanjut,
  deleteTindakLanjut,
};