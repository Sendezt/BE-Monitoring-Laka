const { KasusTabrakKecelakaan } = require("../models");

const {
  successResponse,
  errorResponse,
} = require("../utils/formatResponse");

const logger = require("../utils/logger");

// GET /api/kasus-tabrak-kecelakaan
const getKasusTabrakKecelakaan = async (req, res) => {
  try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await KasusTabrakKecelakaan.findAndCountAll({
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
            "Kasus tabrak kecelakaan retrieved successfully",
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
      "Get kasus tabrak kecelakaan error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to retrieve kasus tabrak kecelakaan"
    );
  }
};

// GET /api/kasus-tabrak-kecelakaan/:id
const getKasusTabrakKecelakaanById = async (req, res) => {
  try {
    const { id } = req.params;

    const kasusTabrak =
      await KasusTabrakKecelakaan.findByPk(id);

    if (
      !kasusTabrak ||
      !kasusTabrak.is_active
    ) {
      return errorResponse(
        res,
        404,
        "Kasus tabrak kecelakaan not found"
      );
    }

    return successResponse(
      res,
      200,
      "Kasus tabrak kecelakaan retrieved successfully",
      kasusTabrak
    );
  } catch (error) {
    logger.error(
      "Get kasus tabrak kecelakaan by ID error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to retrieve kasus tabrak kecelakaan"
    );
  }
};

// POST /api/kasus-tabrak-kecelakaan
const createKasusTabrakKecelakaan = async (req, res) => {
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
    const existingKasusTabrak =
      await KasusTabrakKecelakaan.findOne({
        where: {
          nama: normalizedNama,
        },
      });

    if (existingKasusTabrak) {
      if (!existingKasusTabrak.is_active) {
        return errorResponse(
          res,
          409,
          "Kasus tabrak kecelakaan already exists but is inactive"
        );
      }

      return errorResponse(
        res,
        409,
        "Kasus tabrak kecelakaan already exists"
      );
    }

    const kasusTabrak =
      await KasusTabrakKecelakaan.create({
        nama: normalizedNama,
        is_active: true,
      });

    return successResponse(
      res,
      201,
      "Kasus tabrak kecelakaan created successfully",
      kasusTabrak
    );
  } catch (error) {
    logger.error(
      "Create kasus tabrak kecelakaan error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to create kasus tabrak kecelakaan"
    );
  }
};

// PUT /api/kasus-tabrak-kecelakaan/:id
const updateKasusTabrakKecelakaan = async (req, res) => {
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

    const kasusTabrak =
      await KasusTabrakKecelakaan.findByPk(id);

    if (
      !kasusTabrak ||
      !kasusTabrak.is_active
    ) {
      return errorResponse(
        res,
        404,
        "Kasus tabrak kecelakaan not found"
      );
    }

    const normalizedNama = nama.trim();

    // Check duplicate
    const existingKasusTabrak =
      await KasusTabrakKecelakaan.findOne({
        where: {
          nama: normalizedNama,
        },
      });

    if (
      existingKasusTabrak &&
      existingKasusTabrak.id !==
        kasusTabrak.id
    ) {
      return errorResponse(
        res,
        409,
        "Kasus tabrak kecelakaan already exists"
      );
    }

    await kasusTabrak.update({
      nama: normalizedNama,
    });

    return successResponse(
      res,
      200,
      "Kasus tabrak kecelakaan updated successfully",
      kasusTabrak
    );
  } catch (error) {
    logger.error(
      "Update kasus tabrak kecelakaan error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to update kasus tabrak kecelakaan"
    );
  }
};

// DELETE /api/kasus-tabrak-kecelakaan/:id
const deleteKasusTabrakKecelakaan = async (req, res) => {
  try {
    const { id } = req.params;

    const kasusTabrak =
      await KasusTabrakKecelakaan.findByPk(id);

    if (
      !kasusTabrak ||
      !kasusTabrak.is_active
    ) {
      return errorResponse(
        res,
        404,
        "Kasus tabrak kecelakaan not found"
      );
    }

    // Soft delete
    await kasusTabrak.update({
      is_active: false,
    });

    return successResponse(
      res,
      200,
      "Kasus tabrak kecelakaan deleted successfully",
      null
    );
  } catch (error) {
    logger.error(
      "Delete kasus tabrak kecelakaan error",
      error
    );

    return errorResponse(
      res,
      500,
      "Failed to delete kasus tabrak kecelakaan"
    );
  }
};

module.exports = {
  getKasusTabrakKecelakaan,
  getKasusTabrakKecelakaanById,
  createKasusTabrakKecelakaan,
  updateKasusTabrakKecelakaan,
  deleteKasusTabrakKecelakaan,
};
