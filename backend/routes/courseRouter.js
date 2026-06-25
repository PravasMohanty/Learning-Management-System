const express = require("express");
const courseRouter = express.Router();
const multer = require("multer");

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
// MULTER CONFIG — memory storage, JPG/PNG only, max 5MB
// ======================================================

const thumbnailUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG and PNG images are allowed"), false);
    }
  },
});

// ======================================================
// COURSE ROUTES
// ======================================================

// Create course (admin only) — accepts optional thumbnail file
courseRouter.post(
  "/",
  authMiddleware,
  adminMiddleware,
  thumbnailUpload.single("thumbnail"),
  createCourse
);

// Get all courses (public)
courseRouter.get("/", getAllCourses);

// Get single course (public)
courseRouter.get("/:courseId", getCourseById);

// Update course (admin only) — accepts optional thumbnail file
courseRouter.put(
  "/:courseId",
  authMiddleware,
  adminMiddleware,
  thumbnailUpload.single("thumbnail"),
  updateCourse
);

// Delete course (admin only)
courseRouter.delete("/:courseId", authMiddleware, adminMiddleware, deleteCourse);

// Publish course (admin only)
courseRouter.put("/:courseId/publish", authMiddleware, adminMiddleware, publishCourse);

module.exports = courseRouter;
