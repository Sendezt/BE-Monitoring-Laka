const bcrypt = require("bcrypt");

const User = require("../models/User");
const Wilayah = require("../models/Wilayah");

const { successResponse, errorResponse } = require("../utils/formatResponse");

const logger = require("../utils/logger");

// GET /api/users
const getUsers = async (req, res) => {
  try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await User.findAndCountAll({
            limit: limitNum,
            offset: offset,
      attributes: {
        exclude: ["password"],
      },
      include: [
        {
          model: Wilayah,
          as: "wilayah",
          attributes: ["id", "nama"],
        },
      ],
    });

    return successResponse(
            res,
            200,
            "Users retrieved successfully",
            rows,
            {
                total: count,
                page: pageNum,
                limit: limitNum,
                total_pages: Math.ceil(count / limitNum),
            }
        );
  } catch (error) {
    logger.error("Get users error", error);

    return errorResponse(res, 500, "Failed to retrieve users");
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const { id, username } = req.params;
    const userIdentifier = id || username;

    if (!userIdentifier) {
      return errorResponse(res, 400, "User ID or username is required");
    }

    let whereClause;
    if (!isNaN(userIdentifier) && !isNaN(parseInt(userIdentifier, 10))) {
      whereClause = { id: parseInt(userIdentifier, 10) };
    } else {
      whereClause = { username: userIdentifier };
    }

    const user = await User.findOne({
      where: whereClause,
      attributes: {
        exclude: ["password"],
      },
      include: [
        {
          model: Wilayah,
          as: "wilayah",
          attributes: ["id", "nama"],
        },
      ],
    });

    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    return successResponse(res, 200, "User retrieved successfully", user);
  } catch (error) {
    logger.error("Get user error", error);

    return errorResponse(res, 500, "Failed to retrieve user");
  }
};

const getUserByUsername = async (req, res) => getUserById(req, res);

// POST /api/users
const createUser = async (req, res) => {
  try {
    const { username, nama_lengkap, password, role, wilayah_id } = req.body;

    // Validate required fields
    if (!username || !nama_lengkap || !password || !role || !wilayah_id) {
      return errorResponse(
        res,
        400,
        "Username, nama_lengkap, password, role, and wilayah_id are required",
      );
    }

    // Check username
    const existingUser = await User.findOne({
      where: { username },
    });

    if (existingUser) {
      return errorResponse(res, 409, "Username already exists");
    }

    // Check wilayah
    const wilayah = await Wilayah.findByPk(wilayah_id);

    if (!wilayah) {
      return errorResponse(res, 404, "Wilayah not found");
    }

    // Check wilayah status
    if (!wilayah.is_active) {
      return errorResponse(res, 400, "Wilayah is inactive");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      nama_lengkap,
      password: hashedPassword,
      role,
      wilayah_id,
      is_active: true,
    });

    return successResponse(res, 201, "User created successfully", {
      id: user.id,
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      role: user.role,
      wilayah_id: user.wilayah_id,
      is_active: user.is_active,
    });
  } catch (error) {
    logger.error("Create user error", error);

    return errorResponse(res, 500, "Failed to create user");
  }
};

module.exports = {
  getUsers,
  getUserById,
  getUserByUsername,
  createUser,
};
