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

const { authMiddleware } = require("../middlewares/authMiddleware");
const { adminMiddleware } = require("../middlewares/adminMiddleware");

// ======================================================
// COURSE ROUTES
// ======================================================

// Create course (admin only)
courseRouter.post("/", authMiddleware, adminMiddleware, createCourse);

// Get all courses (public)
courseRouter.get("/", getAllCourses);

// Get single course (public)
courseRouter.get("/:courseId", getCourseById);

// Update course (admin only)
courseRouter.put("/:courseId", authMiddleware, adminMiddleware, updateCourse);

// Delete course (admin only)
courseRouter.delete("/:courseId", authMiddleware, adminMiddleware, deleteCourse);

// Publish course (admin only)
courseRouter.put("/:courseId/publish", authMiddleware, adminMiddleware, publishCourse);

module.exports = courseRouter;
