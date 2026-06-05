const express = require("express");
const courseRouter = express.Router();

const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  publishCourse,
} = require("../controllers/courses/courseController");

// Import middleware if needed
// const { authMiddleware } = require("../middlewares/authMiddleware");
// const { adminMiddleware } = require("../middlewares/adminMiddleware");

// ======================================================
// COURSE ROUTES
// ======================================================

// Create course
courseRouter.post("/", createCourse);

// Get all courses
courseRouter.get("/", getAllCourses);

// Get single course
courseRouter.get("/:courseId", getCourseById);

// Update course
courseRouter.put("/:courseId", updateCourse);

// Delete course
courseRouter.delete("/:courseId", deleteCourse);

// Publish course
courseRouter.put("/:courseId/publish", publishCourse);

module.exports = courseRouter;
