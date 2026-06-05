const express = require("express");
const requestRouter = express.Router();

const {
  approveStudentRequest,
  rejectStudentRequest,
} = require("../controllers/requests/requestController");

// Import middleware if needed
// const { authMiddleware } = require("../middlewares/authMiddleware");
// const { adminMiddleware } = require("../middlewares/adminMiddleware");

// ======================================================
// REGISTRATION REQUEST ROUTES
// ======================================================

// Approve student registration request
requestRouter.put("/:id/approve", approveStudentRequest);

// Reject student registration request
requestRouter.put("/:id/reject", rejectStudentRequest);

module.exports = requestRouter;
