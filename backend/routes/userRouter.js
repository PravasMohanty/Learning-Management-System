const express = require("express");
const userRouter = express.Router();

const {
  lockUserAccount,
  unlockUserAccount,
  listUsers,
  deleteUser,
} = require("../controllers/users/userManagementController");

const {
  getMyProfile,
  getUserProfileByAdmin,
} = require("../controllers/users/profileController");

const { authMiddleware } = require("../middlewares/authMiddleware");
const { adminMiddleware } = require("../middlewares/adminMiddleware");

// ======================================================
// PROFILE ROUTES
// ======================================================

// Get my profile (auth required)
userRouter.get("/profile/me", authMiddleware, getMyProfile);

// Get user profile by admin (admin only)
userRouter.get("/profile/:userId", authMiddleware, adminMiddleware, getUserProfileByAdmin);

// ======================================================
// USER MANAGEMENT ROUTES
// ======================================================

// List all users (admin only)
userRouter.get("/", authMiddleware, adminMiddleware, listUsers);

// Lock user account (admin only)
userRouter.put("/:userId/lock", authMiddleware, adminMiddleware, lockUserAccount);

// Unlock user account (admin only)
userRouter.put("/:userId/unlock", authMiddleware, adminMiddleware, unlockUserAccount);

// Delete user (admin only)
userRouter.delete("/:userId", authMiddleware, adminMiddleware, deleteUser);

module.exports = userRouter;
