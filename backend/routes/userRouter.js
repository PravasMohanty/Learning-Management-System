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

// Import middleware if needed
// const { authMiddleware } = require("../middlewares/authMiddleware");
// const { adminMiddleware } = require("../middlewares/adminMiddleware");

// ======================================================
// PROFILE ROUTES
// ======================================================

// Get my profile
userRouter.get("/profile/me", getMyProfile);

// Get user profile by admin
userRouter.get("/profile/:userId", getUserProfileByAdmin);

// ======================================================
// USER MANAGEMENT ROUTES
// ======================================================

// List all users
userRouter.get("/", listUsers);

// Lock user account
userRouter.put("/:userId/lock", lockUserAccount);

// Unlock user account
userRouter.put("/:userId/unlock", unlockUserAccount);

// Delete user
userRouter.delete("/:userId", deleteUser);

module.exports = userRouter;
