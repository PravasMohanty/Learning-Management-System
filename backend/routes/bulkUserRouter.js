const express = require("express");
const bulkUserRouter = express.Router();

const {
  downloadCSVTemplate,
  createUsersFromCSV,
} = require("../controllers/users/bulkUserController");

const { authMiddleware } = require("../middlewares/authMiddleware");
const { adminMiddleware } = require("../middlewares/adminMiddleware");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// ======================================================
// BULK USER ROUTES
// ======================================================

// Download CSV template for bulk user creation (public - no auth needed)
bulkUserRouter.get("/template/download", downloadCSVTemplate);

// Create users from CSV file (admin only)
bulkUserRouter.post("/upload-csv", authMiddleware, adminMiddleware, upload.single("file"), createUsersFromCSV);

module.exports = bulkUserRouter;
