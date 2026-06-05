const express = require("express");
const bulkUserRouter = express.Router();

const {
  downloadCSVTemplate,
  createUsersFromCSV,
} = require("../controllers/users/bulkUserController");

// Import middleware if needed - may need multer for file upload
// const { authMiddleware } = require("../middlewares/authMiddleware");
// const { adminMiddleware } = require("../middlewares/adminMiddleware");
// const multer = require("multer");
// const upload = multer({ dest: "uploads/" });

// ======================================================
// BULK USER ROUTES
// ======================================================

// Download CSV template for bulk user creation
bulkUserRouter.get("/template/download", downloadCSVTemplate);

// Create users from CSV file
// Note: May need to add multer middleware for file uploads
bulkUserRouter.post("/upload-csv", createUsersFromCSV);

module.exports = bulkUserRouter;
