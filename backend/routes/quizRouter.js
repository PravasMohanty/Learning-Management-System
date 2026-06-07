const express = require("express");
const quizRouter = express.Router();

const {
  createQuizFromCSV,
} = require("../controllers/quiz/quizController");

const { authMiddleware } = require("../middlewares/authMiddleware");
const { adminMiddleware } = require("../middlewares/adminMiddleware");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// ======================================================
// QUIZ ROUTES
// ======================================================

// Create quiz from CSV file (admin only)
quizRouter.post("/:moduleId/create-from-csv", authMiddleware, adminMiddleware, upload.single("file"), createQuizFromCSV);

module.exports = quizRouter;
