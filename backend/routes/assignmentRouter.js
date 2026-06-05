const express = require("express");
const assignmentRouter = express.Router();

const {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignment,
  getAssignments,
  submitAssignment,
  getAssignmentSubmissions,
  gradeAssignmentSubmission,
} = require("../controllers/assignments/assignmentController");

// Import middleware if needed
// const { authMiddleware } = require("../middlewares/authMiddleware");

// ======================================================
// ASSIGNMENT ROUTES
// ======================================================

// Create assignment
assignmentRouter.post("/", createAssignment);

// Get all assignments for a course
assignmentRouter.get("/course/:courseId", getAssignments);

// Get single assignment
assignmentRouter.get("/:assignmentId", getAssignment);

// Update assignment
assignmentRouter.put("/:assignmentId", updateAssignment);

// Delete assignment
assignmentRouter.delete("/:assignmentId", deleteAssignment);

// ======================================================
// SUBMISSION ROUTES
// ======================================================

// Submit assignment
assignmentRouter.post("/:assignmentId/submit", submitAssignment);

// Get submissions for assignment
assignmentRouter.get("/:assignmentId/submissions", getAssignmentSubmissions);

// Grade submission
assignmentRouter.put("/submission/:submissionId/grade", gradeAssignmentSubmission);

module.exports = assignmentRouter;
