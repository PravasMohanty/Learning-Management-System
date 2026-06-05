const express = require("express");
const quizRouter = express.Router();

const {
  createQuizFromCSV,
} = require("../controllers/quiz/quizController");

// Import middleware if needed - may need multer for file upload
// const { authMiddleware } = require("../middlewares/authMiddleware");
// const multer = require("multer");
// const upload = multer({ dest: "uploads/" });

// ======================================================
// QUIZ ROUTES
// ======================================================

// Create quiz from CSV file
// Note: May need to add multer middleware for file uploads
quizRouter.post("/:moduleId/create-from-csv", createQuizFromCSV);

module.exports = quizRouter;
