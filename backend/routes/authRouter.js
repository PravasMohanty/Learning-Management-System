const express = require("express");
const authRouter = express.Router();

const {
  loginUser,
  logoutUser,
  refreshAccessToken,
} = require("../controllers/auth/loginController");

const {
  registerAdmin,
  submitStudentRegistrationRequest,
} = require("../controllers/auth/registerController");

const {
  forgotPassword,
  changePassword,
} = require("../controllers/auth/passwordController");

// Import middleware if needed
const { authMiddleware } = require("../middlewares/authMiddleware");

// ======================================================
// LOGIN ROUTES
// ======================================================

authRouter.post("/login", loginUser);
authRouter.post("/logout", logoutUser);
authRouter.post("/refresh", refreshAccessToken);

// ======================================================
// REGISTRATION ROUTES
// ======================================================

authRouter.post("/register-admin", registerAdmin);
authRouter.post("/register-student-request", submitStudentRegistrationRequest);

// ======================================================
// PASSWORD ROUTES
// ======================================================

authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/change-password", authMiddleware, changePassword);

module.exports = authRouter;
