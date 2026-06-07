const express = require("express");
const requestRouter = express.Router();

const {
  approveStudentRequest,
  rejectStudentRequest,
} = require("../controllers/requests/requestController");

const { authMiddleware } = require("../middlewares/authMiddleware");
const { adminMiddleware } = require("../middlewares/adminMiddleware");

// ======================================================
// REGISTRATION REQUEST ROUTES
// ======================================================

// Approve student registration request (admin only)
requestRouter.put("/:id/approve", authMiddleware, adminMiddleware, approveStudentRequest);

// Reject student registration request (admin only)
requestRouter.put("/:id/reject", authMiddleware, adminMiddleware, rejectStudentRequest);

module.exports = requestRouter;
