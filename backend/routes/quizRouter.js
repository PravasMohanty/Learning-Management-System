const express = require("express");
const quizRouter = express.Router();

const {
  createQuizFromCSV,
  getQuizzesByModule,
  getQuiz,
  getQuizStudent,
  deleteQuiz,
  startQuizAttempt,
  submitQuizAttempt,
  getQuizAttempt,
  getQuizAttemptsForStudent,
  getQuizAttemptsForAdmin,
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

// Get quizzes for a module
quizRouter.get("/module/:moduleId", authMiddleware, getQuizzesByModule);

// Get single quiz with answers (admin only)
quizRouter.get("/:quizId", authMiddleware, adminMiddleware, getQuiz);

// Get single quiz questions without answers (student)
quizRouter.get("/:quizId/student", authMiddleware, getQuizStudent);

// Delete quiz (admin only)
quizRouter.delete("/:quizId", authMiddleware, adminMiddleware, deleteQuiz);

// ======================================================
// ATTEMPT ROUTES
// ======================================================

// Start quiz attempt
quizRouter.post("/:quizId/start", authMiddleware, startQuizAttempt);

// Submit quiz attempt
quizRouter.post("/attempt/:attemptId/submit", authMiddleware, submitQuizAttempt);

// Get attempt details and results
quizRouter.get("/attempt/:attemptId", authMiddleware, getQuizAttempt);

// Get attempts for a quiz (student)
quizRouter.get("/:quizId/my-attempts", authMiddleware, getQuizAttemptsForStudent);

// Get all attempts for a quiz (admin only)
quizRouter.get("/:quizId/attempts", authMiddleware, adminMiddleware, getQuizAttemptsForAdmin);

module.exports = quizRouter;
