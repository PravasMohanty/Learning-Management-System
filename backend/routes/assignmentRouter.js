const express = require("express");
const assignmentRouter = express.Router();

const {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignment,
  getAssignments,
  submitAssignment,
  getMySubmission,
  getAssignmentSubmissions,
  gradeAssignmentSubmission,
} = require("../controllers/assignments/assignmentController");

const { authMiddleware } = require("../middlewares/authMiddleware");
const { adminMiddleware } = require("../middlewares/adminMiddleware");

// ======================================================
// ASSIGNMENT ROUTES
// ======================================================

// Create assignment (admin/instructor)
assignmentRouter.post("/", authMiddleware, createAssignment);

// Get all assignments for a course
assignmentRouter.get("/course/:courseId", getAssignments);

// Get student's own submission for an assignment
assignmentRouter.get("/:assignmentId/my-submission", authMiddleware, getMySubmission);

// Get single assignment
assignmentRouter.get("/:assignmentId", getAssignment);

// Update assignment (admin/instructor)
assignmentRouter.put("/:assignmentId", authMiddleware, updateAssignment);

// Delete assignment (admin/instructor)
assignmentRouter.delete("/:assignmentId", authMiddleware, deleteAssignment);

// ======================================================
// SUBMISSION ROUTES
// ======================================================

// Submit assignment (student)
assignmentRouter.post("/:assignmentId/submit", authMiddleware, submitAssignment);

// Get submissions for assignment (admin/instructor)
assignmentRouter.get("/:assignmentId/submissions", authMiddleware, getAssignmentSubmissions);

// Grade submission (admin/instructor)
assignmentRouter.put("/submission/:submissionId/grade", authMiddleware, gradeAssignmentSubmission);

module.exports = assignmentRouter;
